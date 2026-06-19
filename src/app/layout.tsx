import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shinon Study Pre-Website",
  description: "5 prototype tools to help students learn",
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/notebook", label: "Notebook" },
  { href: "/concept-maps", label: "Concept Maps" },
  { href: "/interactive-exercises", label: "Exercises" },
  { href: "/flash-cards", label: "Flash Cards" },
  { href: "/peer-guides", label: "Peer Guides" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-black text-black dark:text-white">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 text-sm font-medium">
            <span className="mr-auto text-base font-bold tracking-tight">
              Shinon Study
            </span>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
