import Link from "next/link";

const GITHUB_URL = "https://github.com/nash1428/shinon-study-pre-website";
const BLD_WEB_URL = "https://shinon-study-pre-website-4b4066c4.onbld.com";

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

      <section className="mt-12 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">Quick Access</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Download a text file with all links, or open them directly.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/shinon-study-links.txt"
            download
            className="rounded bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Download Links (TXT)
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            GitHub Repo
          </a>
          <a
            href={BLD_WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Live Site
          </a>
        </div>
      </section>
    </div>
  );
}
