"use client";

import Link from "next/link";

const libraries = [
  { name: "shadcn/ui", slug: "shadcn", desc: "Tailwind-native primitives with class-variance-authority", color: "text-pc-accent" },
  { name: "DaisyUI", slug: "daisyui", desc: "Tailwind components with theme system", color: "text-pc-chart-green" },
  { name: "HeroUI", slug: "heroui", desc: "React Aria-based accessible components", color: "text-pc-chart-violet" },
  { name: "Aceternity", slug: "aceternity", desc: "Animation-heavy React components", color: "text-pc-chart-amber" },
  { name: "MagicUI", slug: "magicui", desc: "Next.js animation components", color: "text-pc-chart-red" },
  { name: "Untitled UI", slug: "untitledui", desc: "Figma-to-code design system", color: "text-pc-chart-sky" },
];

export default function UiCompareIndex() {
  return (
    <div className="min-h-screen bg-pc-bg p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-pc-text mb-2">UI Library Comparison</h1>
        <p className="text-pc-text-secondary mb-8">Each prototype uses the same leaderboard &amp; champion stats data. Navigate to compare.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {libraries.map((lib) => (
            <Link key={lib.slug} href={`/ui-compare/${lib.slug}`} className="block">
              <div className="pc-glass p-6 border border-white/5 hover:border-pc-accent/30 transition-colors">
                <h2 className={`text-xl font-semibold ${lib.color} mb-1`}>{lib.name}</h2>
                <p className="text-sm text-pc-text-secondary">{lib.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
