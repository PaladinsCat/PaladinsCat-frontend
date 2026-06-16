export default function AboutPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-pc-accent">About</h1>
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
        <h2 className="text-xl font-semibold mb-4 text-pc-accent">PaladinsCat</h2>
        <p className="text-pc-text mb-4">
          PaladinsCat is a community-driven stats and meta analysis platform for Paladins.
          We track champion win rates, Glicko-2 ratings, counter-pick data, and meta trends
          across all ranked tiers and regions.
        </p>
        <p className="text-pc-text mb-4">
          Built with modern tech — TypeScript, Fastify, PostgreSQL/TimescaleDB, Redis, Next.js,
          and Recharts — PaladinsCat provides deep analytics that go beyond what paladins.guru
          and thebettermeta.com offer.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <h3 className="text-lg font-semibold text-pc-text mb-2">Features</h3>
            <ul className="text-pc-text-secondary space-y-1">
              <li>• Champion win rates, pick rates, ban rates</li>
              <li>• Glicko-2 rating system</li>
              <li>• Counter-pick analysis</li>
              <li>• Player profiles & match history</li>
              <li>• Regional & platform comparisons</li>
              <li>• Patch-over-time trends</li>
              <li>• Loadout & item meta analysis</li>
              <li>• Talent performance tracking</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-pc-text mb-2">Tech Stack</h3>
            <ul className="text-pc-text-secondary space-y-1">
              <li>• Frontend: Next.js 15, Tailwind CSS, Recharts</li>
              <li>• Backend: Fastify, TypeScript</li>
              <li>• Database: PostgreSQL + TimescaleDB</li>
              <li>• Cache: Redis</li>
              <li>• Data: Hi-Rez API, Marshal Protocol</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
