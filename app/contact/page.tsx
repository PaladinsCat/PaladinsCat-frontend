export default function ContactPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-pc-accent">Contact</h1>
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 space-y-6 text-pc-text-secondary">
        <p>
          Have questions, feedback, or found a bug? We&apos;d love to hear from you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-pc-text mb-3">Discord</h2>
            <p className="mb-3">The fastest way to reach us is through our Discord community.</p>
            <a
              href="https://discord.gg/VqYMXAR"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pc-accent text-pc-bg font-medium hover:bg-pc-accent-secondary transition-colors"
            >
              Join Discord
            </a>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-pc-text mb-3">GitHub</h2>
            <p className="mb-3">Found a bug or want to contribute? Open an issue on our repository.</p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-pc-border text-pc-text hover:border-pc-accent hover:text-pc-accent transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
