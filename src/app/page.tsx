import Link from "next/link";

const prototypes = [
  { href: "/studybook", title: "Studybook", description: "Organised, AI-assisted note-taking inspired by NotebookLM.", color: "bg-blue-600" },
  { href: "/quizcraft", title: "Quizcraft", description: "Auto-generated practice questions with instant feedback.", color: "bg-purple-600" },
  { href: "/brainmap", title: "Brainmap", description: "Visualise ideas and relationships to deepen understanding.", color: "bg-pink-600" },
  { href: "/flashforge", title: "Flashforge", description: "Spaced-repetition flashcards for long-term retention.", color: "bg-orange-600" },
  { href: "/coursecompass", title: "Coursecompass", description: "AI-curated learning paths and peer-reviewed resources.", color: "bg-teal-600" },
  { href: "/notion", title: "Notion Builder", description: "Notion-style block editor for structured study pages.", color: "bg-indigo-600" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Academic Prototype Hub</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">Explore five learning tools designed to help you study smarter.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {prototypes.map((p) => (
          <Link key={p.href} href={p.href} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className={`mb-3 inline-block rounded px-2 py-1 text-xs font-bold text-white ${p.color}`}>{p.title}</div>
            <h2 className="text-xl font-semibold">{p.title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{p.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
