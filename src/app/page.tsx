import Link from "next/link";

const prototypes = [
  {
    href: "/notebook",
    title: "Study Notebook",
    description: "Organised, AI-assisted note-taking inspired by NotebookLM.",
  },
  {
    href: "/concept-maps",
    title: "Concept Maps",
    description: "Visualise ideas and relationships to deepen understanding.",
  },
  {
    href: "/interactive-exercises",
    title: "Interactive Exercises",
    description: "Auto-generated practice questions with instant feedback.",
  },
  {
    href: "/flash-cards",
    title: "Flash Cards",
    description: "Quick review cards created from your study material.",
  },
  {
    href: "/peer-guides",
    title: "Peer Guides",
    description: "Curated resources explained by AI, ranked by students.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Academic Prototype Hub
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Explore five learning tools designed to help you study smarter.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {prototypes.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-xl font-semibold">{p.title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {p.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
