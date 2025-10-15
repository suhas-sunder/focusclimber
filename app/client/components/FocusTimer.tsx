import { useEffect, useMemo, useRef, useState } from "react";

const MODES = {
  pomodoro: { label: "Pomodoro", minutes: 25 }, // set to 25 for production
  short: { label: "Short Break", minutes: 5 },
  long: { label: "Long Break", minutes: 15 },
} as const;

type Task = {
  id: number;
  text: string;
  est: number;
  donePomos: number;
  projects: string[];
  notes?: string;
  completed?: boolean;
  completedAt?: number;
  editing?: boolean;
};

export default function FocusTimer() {
  const [mode, setMode] = useState<keyof typeof MODES>("pomodoro");

  // --- Single source of truth for time left (in seconds) ---
  const [remaining, setRemaining] = useState(MODES.pomodoro.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<number | null>(null);

  const [newTask, setNewTask] = useState("");
  const [estPomos, setEstPomos] = useState(1);
  const [projectInput, setProjectInput] = useState("");
  const [projectTags, setProjectTags] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // ETA end time (null when paused/reset)
  const [endTime, setEndTime] = useState<number | null>(null);

  // Prevent duplicate completion calls
  const completionGuardRef = useRef(false);

  // Per-task edit input for adding project tags while editing
  const [editProjectInput, setEditProjectInput] = useState<
    Record<number, string>
  >({});

  // Completed task detail modal
  const [completedDetail, setCompletedDetail] = useState<Task | null>(null);

  // === Load saved data ===
  useEffect(() => {
    const savedTasks = localStorage.getItem("focusclimber_tasks_v7");
    const doneTasks = localStorage.getItem("focusclimber_completed_v7");
    const savedMode = localStorage.getItem("focusclimber_mode_v7");
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (doneTasks) setCompletedTasks(JSON.parse(doneTasks));
    if (savedMode && MODES[savedMode as keyof typeof MODES]) {
      const m = savedMode as keyof typeof MODES;
      setMode(m);
      setRemaining(MODES[m].minutes * 60);
    }
  }, []);

  useEffect(() => {
    // auto-clear completed tasks older than 1 day (same calendar date)
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const lastClear = localStorage.getItem("focusclimber_lastClear_v1");
    if (lastClear !== todayKey) {
      setCompletedTasks((prev) => {
        const filtered = prev.filter((t) => {
          if (!t.completedAt) return false;
          const d = new Date(t.completedAt);
          const dayKey = d.toISOString().slice(0, 10);
          return dayKey === todayKey;
        });
        return filtered;
      });
      localStorage.setItem("focusclimber_lastClear_v1", todayKey);
    }
  }, []);

  // === Persist changes ===
  useEffect(() => {
    localStorage.setItem("focusclimber_tasks_v7", JSON.stringify(tasks));
    localStorage.setItem(
      "focusclimber_completed_v7",
      JSON.stringify(completedTasks)
    );
    localStorage.setItem("focusclimber_mode_v7", mode);
  }, [tasks, completedTasks, mode]);

  // === Reset on mode change ===
  useEffect(() => {
    setIsRunning(false);
    setEndTime(null);
    completionGuardRef.current = false;
    setRemaining(MODES[mode].minutes * 60);
  }, [mode]);

  // === Timer logic (driven only by isRunning) ===
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev > 1) return prev - 1;
        // prev is 1 or 0 -> on next tick, complete
        if (!completionGuardRef.current) {
          completionGuardRef.current = true;
          handleComplete();
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  // === Completion beep (system-safe WebAudio) ===
  const beep = () => {
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      // ensure context is resumed (user gesture unlock)
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = 880; // mid-high pitch
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn("Beep error:", e);
    }
  };

  const handleComplete = () => {
    setIsRunning(false);
    setEndTime(null);
    beep();

    // Only count progress for Pomodoro sessions
    if (mode !== "pomodoro") {
      resetTimerAfterCompletion();
      return;
    }

    // Increment pomodoro for current (top) task, possibly complete it
    setTasks((prev) => {
      if (prev.length === 0) {
        resetTimerAfterCompletion();
        return prev;
      }

      const currentId = activeTask ?? prev[0].id;
      const updated = prev.map((t) =>
        t.id === currentId ? { ...t, donePomos: t.donePomos + 1 } : t
      );

      const current = updated.find((t) => t.id === currentId);
      if (current && current.donePomos >= current.est) {
        const finished = {
          ...current,
          completed: true,
          completedAt: Date.now(),
        };

        setCompletedTasks((prevDone) => {
          if (prevDone.some((d) => d.id === finished.id)) return prevDone;
          return [finished, ...prevDone];
        });
        const nextList = updated.filter((t) => t.id !== currentId);
        setActiveTask(nextList[0]?.id ?? null);
        resetTimerAfterCompletion();
        return nextList;
      }

      resetTimerAfterCompletion();
      return updated;
    });
  };

  const resetTimerAfterCompletion = () => {
    completionGuardRef.current = false;
    setIsRunning(false);
    setEndTime(null);
    setRemaining(MODES[mode].minutes * 60);
  };

  const toggleTimer = () => {
    if (!isRunning) {
      // If already at 0, refill to full length before starting
      if (remaining <= 0) {
        const refill = MODES[mode].minutes * 60;
        setRemaining(refill);
        setEndTime(Date.now() + refill * 1000);
        completionGuardRef.current = false;
        setIsRunning(true);
        return;
      }
      setEndTime(Date.now() + remaining * 1000);
      completionGuardRef.current = false;
      setIsRunning(true);
    } else {
      // pause
      setIsRunning(false);
      setEndTime(null);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setEndTime(null);
    completionGuardRef.current = false;
    setRemaining(MODES[mode].minutes * 60);
  };

  // === Fullscreen ===
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // === Task Management ===
  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now(),
      text: newTask.trim(),
      est: estPomos,
      donePomos: 0,
      projects: projectTags,
      notes: note,
    };
    const next = [...tasks, task];
    setTasks(next);
    setNewTask("");
    setEstPomos(1);
    setProjectTags([]);
    setNote("");
    if (!activeTask) setActiveTask(task.id);
  };

  const completeTask = (id: number, list: Task[] = tasks) => {
    const t = list.find((x) => x.id === id);
    if (!t) return;
    const finished = { ...t, completed: true, completedAt: Date.now() };
    setCompletedTasks((prevDone) => {
      if (prevDone.some((d) => d.id === finished.id)) return prevDone;
      return [finished, ...prevDone];
    });
    const next = list.filter((x) => x.id !== id);
    setTasks(next);
    if (activeTask === id) setActiveTask(next[0]?.id ?? null);
  };

  const deleteTask = (id: number) => {
    const next = tasks.filter((t) => t.id !== id);
    setTasks(next);
    if (activeTask === id) setActiveTask(next[0]?.id ?? null);
  };

  const updateTaskField = (id: number, field: keyof Task, value: any) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );

  // === Native Drag & Drop ===
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...tasks];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);
    setTasks(updated);
    setDraggedIndex(index);
  };
  const handleDrop = () => {
    setDraggedIndex(null);
    if (tasks.length > 0) setActiveTask(tasks[0].id);
  };

  // === Auto-set topmost task as active ===
  useEffect(() => {
    if (!activeTask && tasks.length > 0) {
      setActiveTask(tasks[0].id);
    } else if (tasks.length === 0) {
      setActiveTask(null);
    }
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  // === Project Tags (task-creation form) ===
  const addProjectTag = () => {
    const v = projectInput.trim();
    if (v && !projectTags.includes(v)) {
      setProjectTags((tags) => [...tags, v]);
      setProjectInput("");
    }
  };
  const removeProjectTag = (p: string) =>
    setProjectTags((tags) => tags.filter((tag) => tag !== p));

  // === UI helpers (derived from remaining) ===
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const totalSeconds = MODES[mode].minutes * 60;
  const progress = Math.max(
    0,
    Math.min(100, ((totalSeconds - remaining) / totalSeconds) * 100)
  );

  // stable finish time from locked endTime
  const finishTime = useMemo(() => {
    if (!endTime) return "—";
    const end = new Date(endTime);
    return end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [endTime]);

  // Render helpers for editing projects within a task
  const addEditProjectTag = (taskId: number) => {
    const value = (editProjectInput[taskId] || "").trim();
    if (!value) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId && !t.projects.includes(value)
          ? { ...t, projects: [...t.projects, value] }
          : t
      )
    );
    setEditProjectInput((m) => ({ ...m, [taskId]: "" }));
  };
  const removeEditProjectTag = (taskId: number, tag: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, projects: t.projects.filter((p) => p !== tag) }
          : t
      )
    );
  };

  const activeObj = tasks.find((t) => t.id === activeTask);

  return (
    <div className="relative mx-auto mt-10 w-full max-w-lg rounded-2xl border border-emerald-200 bg-white/90 p-6 text-center shadow-sm">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@500;700&display=swap');
        .rounded-font { font-family: 'Rubik', sans-serif; }
        `}
      </style>

      {/* Fullscreen */}
      <button
        onClick={toggleFullscreen}
        title="Toggle Fullscreen"
        className="absolute right-4 top-4 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
      >
        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      </button>

      {/* Mode Tabs (manual; no auto-switching) */}
      <div className="mb-4 mt-6 flex justify-center gap-2">
        {Object.entries(MODES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setMode(key as keyof typeof MODES)}
            className={`rounded-lg px-3 py-1 text-sm font-medium ${
              mode === key
                ? "bg-emerald-600 text-white"
                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
            }`}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Timer (static width; tabular nums) */}
      <div className="mb-6 select-none rounded-font font-bold tracking-widest text-emerald-900 md:text-8xl text-7xl">
        <span
          className="inline-block min-w-[10ch] text-center font-mono tabular-nums"
          style={{ letterSpacing: "0.05em" }}
        >
          {formatted}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-emerald-100">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="mb-6 flex justify-center gap-3">
        <button
          onClick={toggleTimer}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-lg text-white transition hover:bg-emerald-700"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={resetTimer}
          className="rounded-xl border border-emerald-400 px-6 py-3 text-lg text-emerald-800 transition hover:bg-emerald-50"
        >
          Reset
        </button>
      </div>

      {/* Active Task */}
      {activeObj && (
        <div className="mb-5 text-emerald-700">
          <p className="font-semibold">{activeObj.text}</p>
          <p className="text-xs italic">
            {activeObj.donePomos}/{activeObj.est} Pomos
            {finishTime !== "—" && <> • Finish ~ {finishTime}</>}
          </p>
        </div>
      )}

      {/* Task List */}
      <div className="mb-6 text-left border-t border-emerald-100 pt-4">
        <h4 className="mb-3 font-semibold text-emerald-900">
          Tasks (drag to reorder)
        </h4>
        <ul className="mb-4 space-y-2">
          {tasks.map((t, i) => (
            <li
              key={t.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => {
                e.preventDefault();
                handleDragOver(i);
              }}
              onDrop={handleDrop}
              className={`rounded-md border px-3 py-2 text-sm transition ${
                activeTask === t.id
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-emerald-100 bg-white hover:bg-emerald-50"
              }`}
            >
              {t.editing ? (
                <div className="space-y-2">
                  {/* Text */}
                  <input
                    type="text"
                    value={t.text}
                    onChange={(e) =>
                      updateTaskField(t.id, "text", e.target.value)
                    }
                    className="w-full rounded-md border border-emerald-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  {/* Notes */}
                  <textarea
                    value={t.notes || ""}
                    onChange={(e) =>
                      updateTaskField(t.id, "notes", e.target.value)
                    }
                    placeholder="Notes..."
                    className="w-full rounded-md border border-emerald-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  {/* Est Pomos */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-emerald-700">
                      Est Pomos:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={t.est}
                      onChange={(e) =>
                        updateTaskField(
                          t.id,
                          "est",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-20 rounded border border-emerald-300 px-2 py-1 text-sm"
                    />
                  </div>
                  {/* Project tags editor */}
                  <div>
                    <div className="mb-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="+ Add Project"
                        value={editProjectInput[t.id] || ""}
                        onChange={(e) =>
                          setEditProjectInput((m) => ({
                            ...m,
                            [t.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && addEditProjectTag(t.id)
                        }
                        className="flex-grow rounded-md border border-emerald-200 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => addEditProjectTag(t.id)}
                        className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {t.projects.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800"
                        >
                          {p}{" "}
                          <button
                            onClick={() => removeEditProjectTag(t.id, p)}
                            className="ml-1 text-emerald-600 hover:text-emerald-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => updateTaskField(t.id, "editing", false)}
                      className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => updateTaskField(t.id, "editing", false)}
                      className="rounded-md border border-emerald-300 px-3 py-1 text-sm text-emerald-800 hover:bg-emerald-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <div
                      className="cursor-pointer font-medium text-emerald-800"
                      onClick={() => setActiveTask(t.id)}
                      title="Set active"
                    >
                      {t.text}
                    </div>
                    <div className="text-xs text-emerald-600">
                      {t.donePomos}/{t.est} Pomos{" "}
                      {t.projects.length > 0 && (
                        <span className="ml-1">• {t.projects.join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 flex gap-2">
                    <button
                      onClick={() => updateTaskField(t.id, "editing", true)}
                      className="text-emerald-600 hover:text-emerald-900"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => completeTask(t.id)}
                      className="text-emerald-600 hover:text-emerald-900"
                      title="Mark complete"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="text-emerald-600 hover:text-emerald-900"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Add Task */}
        <div className="rounded-md border border-emerald-200 p-3 text-sm">
          <input
            type="text"
            placeholder="What are you working on?"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="mb-2 w-full rounded-md border border-emerald-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="mb-2 flex items-center gap-2">
            <label className="text-xs text-emerald-700">Est Pomodoros:</label>
            <input
              type="number"
              min={1}
              max={50}
              value={estPomos}
              onChange={(e) => setEstPomos(parseInt(e.target.value) || 1)}
              className="w-20 rounded border border-emerald-300 px-2 py-1 text-sm"
            />
          </div>

          {/* Projects */}
          <div className="mb-2">
            <div className="mb-2 flex gap-2">
              <input
                type="text"
                placeholder="+ Add Project"
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addProjectTag()}
                className="flex-grow rounded-md border border-emerald-200 px-2 py-1 text-sm"
              />
              <button
                onClick={addProjectTag}
                className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {projectTags.map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800"
                >
                  {p}{" "}
                  <button
                    onClick={() => removeProjectTag(p)}
                    className="ml-1 text-emerald-600 hover:text-emerald-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <textarea
            placeholder="+ Add Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mb-2 w-full rounded-md border border-emerald-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="flex justify-end">
            <button
              onClick={addTask}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="border-t border-emerald-100 pt-4 text-left">
          <h4 className="mb-2 font-semibold text-emerald-900">
            Completed Today
          </h4>
          <ul className="space-y-2 text-sm text-emerald-700">
            {completedTasks.map((t) => (
              <li
                key={t.id}
                className="flex cursor-pointer items-center justify-between rounded-md bg-emerald-50 px-3 py-2 hover:bg-emerald-100"
                onClick={() => setCompletedDetail(t)}
                title="View details"
              >
                <span>{t.text}</span>
                <span className="text-xs text-emerald-600">
                  {t.est} Pomos
                  {t.projects.length > 0 && ` • ${t.projects.join(", ")}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Completed Task Modal */}
      {completedDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setCompletedDetail(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-semibold text-emerald-900">
              {completedDetail.text}
            </h3>
            <div className="mb-2 text-sm text-emerald-700">
              <strong>Pomodoros:</strong> {completedDetail.donePomos}/
              {completedDetail.est}
            </div>
            {completedDetail.projects?.length > 0 && (
              <div className="mb-2 text-sm text-emerald-700">
                <strong>Projects:</strong> {completedDetail.projects.join(", ")}
              </div>
            )}
            {completedDetail.notes && (
              <div className="mb-4 whitespace-pre-wrap text-sm text-emerald-700">
                <strong>Notes:</strong> {completedDetail.notes}
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setCompletedDetail(null)}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
