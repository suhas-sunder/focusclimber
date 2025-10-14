import { useEffect, useMemo, useState } from "react";

const MODES = {
  pomodoro: { label: "Pomodoro", minutes: 25 },
  short: { label: "Short Break", minutes: 5 },
  long: { label: "Long Break", minutes: 15 },
};

type Task = {
  id: number;
  text: string;
  est: number;
  donePomos: number;
  projects: string[];
  notes?: string;
  completed?: boolean;
  editing?: boolean;
};

export default function FocusTimer() {
  const [mode, setMode] = useState<keyof typeof MODES>("pomodoro");
  const [minutes, setMinutes] = useState(MODES.pomodoro.minutes);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<number | null>(null);
  const [newTask, setNewTask] = useState("");
  const [estPomos, setEstPomos] = useState(1);
  const [projectInput, setProjectInput] = useState("");
  const [projectTags, setProjectTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // === Load saved data ===
  useEffect(() => {
    const savedTasks = localStorage.getItem("focusclimber_tasks_v7");
    const doneTasks = localStorage.getItem("focusclimber_completed_v7");
    const savedMode = localStorage.getItem("focusclimber_mode_v7");
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (doneTasks) setCompletedTasks(JSON.parse(doneTasks));
    if (savedMode && MODES[savedMode as keyof typeof MODES])
      setMode(savedMode as keyof typeof MODES);
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

  // === Timer logic ===
  useEffect(() => {
    setMinutes(MODES[mode].minutes);
    setSeconds(0);
  }, [mode]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      if (seconds > 0) setSeconds((s) => s - 1);
      else if (minutes > 0) {
        setMinutes((m) => m - 1);
        setSeconds(59);
      } else handleComplete();
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, minutes, seconds, mode]);

  const handleComplete = () => {
    setIsRunning(false);
    try {
      new Audio("/chime.mp3").play();
    } catch {}

    // Only count progress for Pomodoro sessions
    if (mode !== "pomodoro") return;

    setCompletedPomodoros((n) => n + 1);

    setTasks((prev) => {
      if (prev.length === 0) return prev;
      const currentId = activeTask ?? prev[0].id;
      const updated = prev.map((t) =>
        t.id === currentId ? { ...t, donePomos: t.donePomos + 1 } : t
      );

      // Find the updated task
      const current = updated.find((t) => t.id === currentId);
      if (current && current.donePomos >= current.est) {
        // Move to completed list
        const finished = { ...current, completed: true };
        setCompletedTasks((prevDone) => [finished, ...prevDone]);
        return updated.filter((t) => t.id !== currentId);
      }

      return updated;
    });
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(MODES[mode].minutes);
    setSeconds(0);
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
    setTasks([...tasks, task]);
    setNewTask("");
    setEstPomos(1);
    setProjectTags([]);
    setNote("");
  };

  const completeTask = (id: number, list: Task[] = tasks) => {
    const t = list.find((x) => x.id === id);
    if (t) {
      const updated = { ...t, completed: true };
      setCompletedTasks([updated, ...completedTasks]);
      setTasks(list.filter((x) => x.id !== id));
      if (activeTask === id) setActiveTask(null);
    }
  };

  const deleteTask = (id: number) => setTasks(tasks.filter((t) => t.id !== id));

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
  }, [tasks]);

  // === Project Tags ===
  const addProjectTag = () => {
    if (projectInput.trim() && !projectTags.includes(projectInput.trim())) {
      setProjectTags([...projectTags, projectInput.trim()]);
      setProjectInput("");
    }
  };

  const removeProjectTag = (p: string) =>
    setProjectTags(projectTags.filter((tag) => tag !== p));

  // === UI helpers ===
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const totalSeconds = MODES[mode].minutes * 60;
  const elapsed = totalSeconds - (minutes * 60 + seconds);
  const progress = (elapsed / totalSeconds) * 100;
  const finishTime = useMemo(() => {
    const end = new Date(Date.now() + (minutes * 60 + seconds) * 1000);
    return end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [minutes, seconds]);

  return (
    <div className="mx-auto mt-10 w-full max-w-lg rounded-2xl border border-emerald-200 bg-white/90 p-6 text-center shadow-sm relative">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@500;700&display=swap');
        .rounded-font { font-family: 'Rubik', sans-serif; }
        `}
      </style>

      {/* Fullscreen */}
      <button
        onClick={toggleFullscreen}
        title="Toggle Fullscreen (F)"
        className="absolute right-4 top-4 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
      >
        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      </button>

      {/* Mode Tabs */}
      <div className="mb-4 flex justify-center gap-2 mt-6">
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

      {/* Timer */}
      <div className="mb-6 select-none font-bold text-emerald-900 md:text-8xl text-7xl rounded-font tracking-widest">
  <span
    className="inline-block min-w-[10ch] text-center font-mono tabular-nums"
    style={{ letterSpacing: "0.05em" }}
  >
    {formatted}
  </span>
</div>

      <div className="h-3 w-full rounded-full bg-emerald-100 mb-4 overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={toggleTimer}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-lg text-white hover:bg-emerald-700 transition"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={resetTimer}
          className="rounded-xl border border-emerald-400 px-6 py-3 text-lg text-emerald-800 hover:bg-emerald-50 transition"
        >
          Reset
        </button>
      </div>

      {/* Active Task */}
      {tasks.length > 0 && (
        <div className="mb-5 text-emerald-700">
          <p className="font-semibold">
            {tasks.find((t) => t.id === activeTask)?.text}
          </p>
          <p className="text-xs italic">
            {tasks.find((t) => t.id === activeTask)?.donePomos}/
            {tasks.find((t) => t.id === activeTask)?.est} Pomos • Finish ~{" "}
            {finishTime}
          </p>
        </div>
      )}

      {/* Task List */}
      <div className="text-left border-t border-emerald-100 pt-4 mb-6">
        <h4 className="font-semibold text-emerald-900 mb-3">
          Tasks (drag to reorder)
        </h4>
        <ul className="space-y-2 mb-4">
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
              <div className="flex items-center justify-between">
                <div className="flex-grow">
                  <div className="font-medium text-emerald-800">{t.text}</div>
                  <div className="text-xs text-emerald-600">
                    {t.donePomos}/{t.est} Pomos{" "}
                    {t.projects.length > 0 && (
                      <span className="ml-1">• {t.projects.join(", ")}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => completeTask(t.id)}
                    className="text-emerald-600 hover:text-emerald-900"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="text-emerald-600 hover:text-emerald-900"
                  >
                    ✕
                  </button>
                </div>
              </div>
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
            className="w-full rounded-md border border-emerald-200 px-2 py-1 mb-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
          />
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-emerald-700">Est Pomodoros:</label>
            <input
              type="number"
              min={1}
              max={10}
              value={estPomos}
              onChange={(e) => setEstPomos(parseInt(e.target.value) || 1)}
              className="w-16 rounded border border-emerald-300 px-1 py-0.5 text-center text-sm"
            />
          </div>

          {/* Projects */}
          <div className="mb-2">
            <div className="flex gap-2 mb-2">
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
                className="rounded-md bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700 text-sm"
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
            className="w-full rounded-md border border-emerald-200 px-2 py-1 mb-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none"
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
          <h4 className="font-semibold text-emerald-900 mb-2">
            Completed Today
          </h4>
          <ul className="space-y-2 text-sm text-emerald-700">
            {completedTasks.map((t) => (
              <li
                key={t.id}
                className="flex justify-between rounded-md bg-emerald-50 px-3 py-2"
              >
                <span>{t.text}</span>
                <span className="text-xs text-emerald-600">
                  {t.est} Pomos • {t.projects.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
