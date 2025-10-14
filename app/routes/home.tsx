import type { Route } from "./+types/home";
import { json } from "@remix-run/node";
import FocusTimer from "~/client/components/FocusTimer";

/* =========================================================
   META
========================================================= */
export function meta({}: Route.MetaArgs) {
  const title =
    "FocusClimber | Mindful Pomodoro Timer for Deep Work & Calm Productivity";
  const description =
    "FocusClimber reimagines the Pomodoro method as a mindful mountain climb. Focus deeply, rest consciously, and build lasting productivity habits without burnout.";
  const url = "https://focusclimber.com/";

  return [
    { title },
    { name: "description", content: description },
    {
      name: "keywords",
      content: [
        "focus climber",
        "mindful pomodoro",
        "deep work timer",
        "focus timer app",
        "calm productivity",
        "work focus tracker",
        "meditative pomodoro",
        "mountain focus",
        "distraction free study",
        "habit focus tracker",
      ].join(", "),
    },
    { name: "robots", content: "index,follow,max-image-preview:large" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: `${url}og-image.jpg` },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { rel: "canonical", href: url },
    { name: "theme-color", content: "#8FBF9F" },
  ];
}

/* =========================================================
   LOADER
========================================================= */
export function loader() {
  return json({ nowISO: new Date().toISOString() });
}

/* =========================================================
   UTIL
========================================================= */
const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
    <h3 className="text-lg font-semibold text-emerald-900">{title}</h3>
    <div className="mt-2 text-sm text-emerald-800">{children}</div>
  </div>
);

/* =========================================================
   PAGE
========================================================= */
export default function Home({ loaderData: { nowISO } }: Route.ComponentProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "FocusClimber",
        url: "https://focusclimber.com/",
        description:
          "FocusClimber transforms Pomodoro focus sessions into mindful climbs. Build deep focus, rest intentionally, and connect your work rhythm with calm growth.",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://focusclimber.com/?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        name: "FocusClimber",
        url: "https://focusclimber.com/",
        logo: "https://focusclimber.com/logo.png",
        sameAs: [
          "https://www.youtube.com/@iLoveHabits",
          "https://www.instagram.com/ilovehabits/",
          "https://www.pinterest.com/ilovehabits/",
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is FocusClimber?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FocusClimber is a mindful Pomodoro-based productivity app that turns each focus session into a calm mountain climb. It helps you develop focus endurance without burnout.",
            },
          },
          {
            "@type": "Question",
            name: "How does the Pomodoro system work in FocusClimber?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Each Pomodoro session becomes a 'climb', a 25 to 60-minute focus session followed by a mindful rest. After every four climbs, you take a long recovery break to reset.",
            },
          },
          {
            "@type": "Question",
            name: "What makes FocusClimber different from other Pomodoro apps?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "It blends productivity with mindfulness. Instead of gamified stats or noise, FocusClimber uses calm visuals, nature-inspired themes, and reflection breaks to help you focus peacefully.",
            },
          },
          {
            "@type": "Question",
            name: "Can I track progress visually?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Each climb contributes to a mountain trail map that shows your long-term focus consistency through peaks and valleys of attention.",
            },
          },
          {
            "@type": "Question",
            name: "Does FocusClimber integrate with iLoveHabits or MoodHabits?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. FocusClimber connects seamlessly with iLoveHabits for routine tracking and MoodHabits for emotional reflection, helping you see how focus, mood, and discipline interact.",
            },
          },
          {
            "@type": "Question",
            name: "Is FocusClimber free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The core Pomodoro timer and focus tracker are free. Optional premium features include ambient nature soundscapes, advanced analytics, and custom trail themes.",
            },
          },
          {
            "@type": "Question",
            name: "Can I use FocusClimber offline?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. All session data and notes are stored locally and sync automatically when you reconnect.",
            },
          },
          {
            "@type": "Question",
            name: "Who is FocusClimber for?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FocusClimber is for students, creators, and professionals who want to build focus stamina gently, combining productivity with mental calm.",
            },
          },
        ],
      },
    ],
  } as const;

  return (
    <main className="bg-gradient-to-b from-emerald-50 via-sky-50 to-white text-emerald-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER */}
      <header className="border-b border-emerald-100 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 text-center text-sm text-emerald-700">
          🏔️ Updated {new Date(nowISO).toLocaleDateString()} • FocusClimber.com
          , Climb Your Focus Mountain
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 pt-10 grid gap-10 md:grid-cols-2 md:items-center pb-4">
        <div className="space-y-5">
          <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-900 leading-tight">
            Focus Calmly. Climb Consistently.
          </h1>
          <p className="text-lg text-emerald-800 leading-relaxed">
            <strong>FocusClimber</strong> transforms the classic Pomodoro method
            into a calm mountain climb. Each session strengthens focus, builds
            clarity, and encourages rest, helping you reach balance between
            ambition and mindfulness.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#timer"
              className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-emerald-800 shadow-sm hover:bg-emerald-100 transition"
            >
              Try the Focus Timer
            </a>
            <a
              href="#pomodoro"
              className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-emerald-800 shadow-sm hover:bg-emerald-100 transition"
            >
              Learn Pomodoro Flow
            </a>
          </div>
        </div>

        {/* Mountain SVG */}
        <div className="flex justify-center md:justify-end">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 400 300"
            className="w-80 md:w-96"
          >
            <path
              d="M20 250 L120 100 L200 200 L280 80 L380 250 Z"
              fill="none"
              stroke="#4B8B74"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <circle cx="120" cy="100" r="6" fill="#4B8B74" />
            <circle cx="200" cy="200" r="6" fill="#4B8B74" />
            <circle cx="280" cy="80" r="6" fill="#4B8B74" />
            <text
              x="50"
              y="270"
              fill="#4B8B74"
              fontSize="14"
              fontFamily="sans-serif"
            >
              Your Focus Trail
            </text>
          </svg>
        </div>
      </section>

      {/* TIMER */}
      <section id="timer" className="mx-auto max-w-7xl px-4">
        <FocusTimer />
      </section>

      {/* === HOW TO USE SECTION === */}
      <section
        id="how-to-use"
        className="mx-auto mt-10 max-w-3xl rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-left leading-relaxed text-emerald-900"
      >
        <h2 className="mb-3 text-2xl font-bold text-emerald-800">
          How to Use FocusClimber
        </h2>
        <p className="mb-4 text-emerald-800">
          FocusClimber helps you stay productive through structured Pomodoro
          sessions while keeping your task list, project goals, and focus stats
          organized. Each Pomodoro is a 25-minute climb toward a finished task,
          followed by a short or long recovery break. The app automatically
          tracks your focus, reorders tasks, and saves progress locally.
        </p>

        <ol className="list-decimal space-y-3 pl-5 text-emerald-800">
          <li>
            <strong>Add a Task:</strong> Enter what you’re working on, set the
            estimated number of Pomodoros, and add optional project tags or
            notes. Click <em>Save</em> to add it to your list.
          </li>
          <li>
            <strong>Auto-Active Task:</strong> The task at the top of your list
            is automatically selected for your next Pomodoro. As you complete or
            reorder tasks, the next one automatically becomes active, no manual
            clicking required.
          </li>
          <li>
            <strong>Reorder Tasks:</strong> Drag and drop tasks in your list to
            change their priority. FocusClimber will always keep the topmost
            task as your current focus target.
          </li>
          <li>
            <strong>Start the Timer:</strong> Press <em>Start</em> to begin your
            25-minute Pomodoro. Stay focused on the top task, and the app will
            track your work session automatically. The timer can be paused or
            reset anytime.
          </li>
          <li>
            <strong>Automatic Completion:</strong> Once a task reaches its
            estimated Pomodoro count, it’s marked as completed and moved to your
            <em> Completed Today</em> section. The next task in line becomes
            active.
          </li>
          <li>
            <strong>Project Tags:</strong> Use project tags to group related
            tasks or track different goals. Add or remove tags when creating
            tasks, and view them under each task in your list.
          </li>
          <li>
            <strong>Breaks and Focus Cycles:</strong> After each Pomodoro, enjoy
            a short 5-minute break. Every four Pomodoros, FocusClimber
            automatically switches to a 15-minute long break to help you
            recharge before your next climb.
          </li>
          <li>
            <strong>Persistent Settings:</strong> Your selected timer mode,
            tasks, notes, and project data are all stored locally in your
            browser. Closing or refreshing the page won’t erase your progress.
          </li>
          <li>
            <strong>Review Your Day:</strong> Check the <em>Completed Today</em>{" "}
            section to see your finished tasks and total Pomodoro sessions. It’s
            a satisfying summary of your day’s productivity.
          </li>
        </ol>

        <p className="mt-6 text-emerald-700">
          Every Pomodoro is another step up your focus mountain. Keep your pace
          steady, celebrate small wins, and you’ll reach the summit of your
          goals, one session at a time. 🌿⏱️⛰️
        </p>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="mx-auto max-w-7xl px-4 py-12 grid gap-4 sm:grid-cols-3"
      >
        <Card title="🎯 Mindful Focus Sessions">
          25–60 minute deep-work climbs with reflection checkpoints.
        </Card>
        <Card title="🪶 Intentional Breaks">
          Short, mindful rests after each climb prevent fatigue and sharpen
          clarity.
        </Card>
        <Card title="🌄 Visual Trail Progress">
          Your sessions form a growing focus mountain, tracking calm
          consistency.
        </Card>
      </section>

      {/* === SEO-RICH CONTENT SECTION === */}
      <section
        id="about-focusclimber"
        className="mx-auto mt-10 max-w-5xl space-y-6 px-4 leading-relaxed text-emerald-900"
      >
        <h2 className="text-3xl font-bold text-emerald-900">
          Climb Higher With FocusClimber
        </h2>
        <p>
          <strong>FocusClimber</strong> is a mindfulness-based productivity app
          that helps you transform the way you work, study, and create. Built
          around the <em>Pomodoro Technique</em> and the psychology of progress
          tracking, it turns every task into a step up your personal
          productivity mountain. Whether you are a student, freelancer, or
          creative professional, FocusClimber gives you the structure and
          motivation to stay consistent, avoid burnout, and reach your daily
          goals with clarity and calm.
        </p>

        <h3 className="text-2xl font-semibold text-emerald-800">
          The Mountain Metaphor for Deep Work
        </h3>
        <p>
          Productivity can feel like climbing a mountain, each session of focused
          work is a small but steady step toward the summit. FocusClimber
          embraces this analogy. Your Pomodoros represent ascents, your breaks
          are the resting camps, and every completed task becomes a flag planted
          on your progress trail. The mountain-themed interface reflects this
          sense of calm perseverance, using natural greens, earth tones, and
          smooth animations to make productivity feel like an intentional ritual
          instead of a race.
        </p>

        <h3 className="text-2xl font-semibold text-emerald-800">
          What Is the Pomodoro Technique?
        </h3>
        <p>
          The <strong>Pomodoro Technique</strong> is a proven time management
          system developed by Francesco Cirillo in the late 1980s. It divides
          work into focused intervals, traditionally 25 minutes, followed by short
          breaks. After four sessions, you take a longer rest to reset your
          mind. FocusClimber takes this classic method further by connecting it
          with modern digital tools like task tracking, project tags, and
          automatic progress saving. Instead of juggling apps or notebooks,
          everything you need to plan, focus, and reflect is available in one
          peaceful dashboard.
        </p>

        <h3 className="text-2xl font-semibold text-emerald-800">
          Why FocusClimber Works
        </h3>
        <p>
          Unlike generic timers, FocusClimber integrates{" "}
          <em>behavioral design</em> and <em>habit psychology</em>. Each
          Pomodoro you complete provides visible reinforcement, a progress bar,
          an encouraging message, and a sense of completion. Over time, this
          trains your brain to associate deep work with reward. The act of
          ticking off tasks and visualizing your climb releases small dopamine
          boosts that build motivation naturally.
        </p>
        <p>
          The app also values <strong>mindful pacing</strong>. By alternating
          between focused effort and rest, you prevent mental fatigue while
          maintaining creative flow. Breaks are not interruptions but part of
          the rhythm, time to step back, stretch, or look at the bigger picture
          before climbing again.
        </p>

        <h3 className="text-2xl font-semibold text-emerald-800">
          Track Tasks and Projects Seamlessly
        </h3>
        <p>
          FocusClimber includes a simple but powerful{" "}
          <strong>task management system</strong>. You can create multiple
          projects, assign Pomodoro estimates, add personal notes, and group
          related tasks under tags. Each completed Pomodoro is logged against
          the selected task, and once you hit your goal, the task automatically
          moves to your completed list. Everything is stored locally on your
          device, so your focus sessions are private, fast, and always available
          offline.
        </p>
        <p>
          This makes FocusClimber ideal for self-employed professionals,
          students preparing for exams, developers tackling sprints, or anyone
          who prefers a lightweight, distraction-free productivity setup. The
          interface emphasizes clarity and calm, with large rounded numbers,
          smooth color transitions, and minimal noise.
        </p>

        <h3 className="text-2xl font-semibold text-emerald-800">
          Built for Mindful Productivity
        </h3>
        <p>
          FocusClimber isn’t just about getting more done, it’s about doing it
          with intention. Every session begins with a deliberate start and ends
          with reflection. You’re encouraged to focus on one task at a time,
          avoiding multitasking, notifications, or digital clutter. Over time,
          this consistent focus practice cultivates deep work habits and
          improves cognitive endurance.
        </p>
        <p>
          Users describe FocusClimber as “a cross between a productivity app and
          a meditation tool.” The natural color palette and grounded mountain
          theme create a sense of tranquility that keeps you anchored in the
          present. It’s the opposite of the high-pressure dashboards filled with
          charts and distractions, it’s simple, human-centered, and mindful.
        </p>

        <h3 className="text-2xl font-semibold text-emerald-800">
          Visualize Your Progress
        </h3>
        <p>
          FocusClimber’s design gives you a visual language for progress. The{" "}
          <strong>large rounded timer</strong> in the center shows how much time
          remains in your current focus block. The <strong>progress bar</strong>{" "}
          acts as a trail, filling gradually as you move toward completion. The{" "}
          <strong>Completed Today</strong> section at the bottom serves as your
          personal summit log, showing every task you conquered during the day.
        </p>
        <p>
          Each visual element is purposefully crafted to make your effort feel
          tangible. Progress becomes visible, measurable, and rewarding. By
          linking time, focus, and results, FocusClimber helps you develop trust
          in your own consistency.
        </p>

        <h3 className="text-2xl font-semibold text-emerald-800">
          Offline First. Privacy Focused.
        </h3>
        <p>
          Everything you do in FocusClimber is stored securely in your browser’s
          local storage. There’s no login requirement, no cloud sync, and no
          analytics tracking your behavior. This means your Pomodoros, notes,
          and projects stay private and accessible even when offline. It’s
          perfect for travelers, minimalists, and users who want a simple tool
          without distractions or subscriptions.
        </p>

        <h3 className="text-2xl font-semibold text-emerald-800">
          Pomodoro for Study and Work
        </h3>
        <p>
          Students love FocusClimber for exam preparation. By breaking long
          study sessions into 25-minute focus blocks, they retain more
          information and avoid burnout. Professionals use it to tackle creative
          projects, programming tasks, and writing sessions without
          procrastination. Entrepreneurs use it for time-blocking their day. The
          same rhythm applies across all fields, focus, rest, repeat.
        </p>
        <p>
          The built-in task notes also act as mini journals. You can write
          reflections on what went well or what to improve after each Pomodoro,
          turning your productivity data into insight. Over weeks, this builds a
          record of growth that helps you refine your workflow and
          self-awareness.
        </p>

        <h3 className="text-2xl font-semibold text-emerald-800">
          Why FocusClimber Stands Out
        </h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Natural UI:</strong> A nature-inspired interface with
            mountain motifs that promote calm focus.
          </li>
          <li>
            <strong>Offline mode:</strong> Fully functional even without
            internet connection.
          </li>
          <li>
            <strong>Task + Timer integration:</strong> Automatically link
            Pomodoros with tasks and completion goals.
          </li>
          <li>
            <strong>Editable Tasks:</strong> Update titles, tags, and notes
            anytime without losing data.
          </li>
          <li>
            <strong>Project Organization:</strong> Manage multiple projects with
            color-coded or labeled tags.
          </li>
          <li>
            <strong>Auto Progress Save:</strong> All sessions and completed
            tasks persist locally for future review.
          </li>
          <li>
            <strong>Mindful Breaks:</strong> Encourages rest intervals that
            refresh your mind and body.
          </li>
          <li>
            <strong>Privacy Respectful:</strong> No accounts, ads, or data
            tracking. 100% local experience.
          </li>
        </ul>

        <h3 className="text-2xl font-semibold text-emerald-800">
          From Tasks to Triumphs
        </h3>
        <p>
          FocusClimber’s mission is to help users build momentum, one Pomodoro at
          a time. You start small, but each session compounds into mastery. It’s
          about sustainable growth, not sprinting to exhaustion. The mountain
          represents long-term progress and resilience. Even on off days, one
          Pomodoro is still a step forward.
        </p>
        <p>
          Over time, these small steps add up. What began as 25 minutes of focus
          becomes hours of meaningful work. The app quietly reinforces
          discipline through positive repetition, until focus itself becomes a
          habit.
        </p>

        <h3 className="text-2xl font-semibold text-emerald-800">
          Who Uses FocusClimber?
        </h3>
        <p>FocusClimber is designed for anyone who values calm productivity:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            🎓 <strong>Students</strong> managing study sessions and
            assignments.
          </li>
          <li>
            💻 <strong>Developers</strong> seeking deep work cycles for coding
            tasks.
          </li>
          <li>
            🎨 <strong>Creatives</strong> balancing focus and flow in art or
            writing.
          </li>
          <li>
            🏡 <strong>Remote workers</strong> building structure into flexible
            days.
          </li>
          <li>
            🧘 <strong>Mindfulness practitioners</strong> who track focus as
            part of meditation and self-discipline.
          </li>
        </ul>
        <p>
          Each user finds their own rhythm, whether using FocusClimber for
          sprints, daily routines, or creative exploration.
        </p>

        <h3 className="text-2xl font-semibold text-emerald-800">
          Climb Your Focus Mountain Today
        </h3>
        <p>
          The journey toward consistent productivity starts with one step, and
          one Pomodoro. Open FocusClimber, create a task, and start climbing.
          With time, you’ll not only see more done but feel more balanced doing
          it. The progress you see on screen reflects the focus you’re
          cultivating within.
        </p>
        <p>
          FocusClimber is more than a timer. It’s a quiet companion for your
          daily climb, a reminder that steady focus beats forced hustle, and
          every summit begins with a single mindful step. 🌄
        </p>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="mx-auto max-w-7xl px-4 py-10 space-y-6 leading-relaxed text-emerald-800"
      >
        <h2 className="text-2xl font-bold text-emerald-900">
          Frequently Asked Questions
        </h2>
        <dl className="space-y-6 mt-4">
          <div>
            <dt className="font-semibold text-emerald-900">
              What is FocusClimber?
            </dt>
            <dd>
              A mindful Pomodoro timer that transforms focus into an intentional
              journey rather than a race.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-emerald-900">
              Is it based on the Pomodoro Technique?
            </dt>
            <dd>
              Yes. Each “climb” is a Pomodoro focus session, 25 to 60 minutes of
              work followed by mindful rest.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-emerald-900">
              Can I adjust session lengths?
            </dt>
            <dd>
              Yes. You can set custom focus durations and break intervals.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-emerald-900">
              Does it integrate with other iLoveHabits tools?
            </dt>
            <dd>
              Yes. FocusClimber connects with iLoveHabits and MoodHabits for
              combined focus, habit, and emotional tracking.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-emerald-900">
              Is it free to use?
            </dt>
            <dd>
              The base app is free. Premium upgrades will add ambient sound
              packs, analytics, and advanced visualization.
            </dd>
          </div>
        </dl>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-emerald-100 bg-white/60 py-6 text-emerald-800">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © {new Date().getFullYear()} FocusClimber • Climb calmly. Grow
          deeply.
        </div>
      </footer>
    </main>
  );
}
