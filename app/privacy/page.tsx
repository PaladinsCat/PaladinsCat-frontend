export default function PrivacyPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-pc-accent">Privacy Policy</h1>
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 space-y-4 text-pc-text-secondary">
        <p>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" })}</p>

        <h2 className="text-xl font-semibold text-pc-text">1. Information We Collect</h2>
        <p>
          When you create an account, we collect your email address and username. Game-related
          data (match history, player stats) is sourced from the Hi-Rez API and is publicly
          available information.
        </p>

        <h2 className="text-xl font-semibold text-pc-text">2. How We Use Your Information</h2>
        <p>
          Your information is used solely to provide and improve PaladinsCat. We do not sell
          or share your personal data with third parties for marketing purposes.
        </p>

        <h2 className="text-xl font-semibold text-pc-text">3. Cookies</h2>
        <p>
          We use essential cookies for authentication and session management. We do not use
          tracking or advertising cookies.
        </p>

        <h2 className="text-xl font-semibold text-pc-text">4. Data Security</h2>
        <p>
          We implement industry-standard security measures to protect your data. However,
          no method of transmission over the internet is 100% secure.
        </p>

        <h2 className="text-xl font-semibold text-pc-text">5. Third-Party Services</h2>
        <p>
          Game data is retrieved from the Hi-Rez Studios API. Their handling of data is governed
          by their own privacy policy.
        </p>

        <h2 className="text-xl font-semibold text-pc-text">6. Contact</h2>
        <p>
          For questions about this privacy policy, reach out via our{" "}
          <a href="https://discord.gg/VqYMXAR" className="text-pc-accent hover:underline" target="_blank" rel="noopener noreferrer">
            Discord server
          </a>.
        </p>
      </div>
    </div>
  );
}
