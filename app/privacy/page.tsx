export default function PrivacyPage() {
  return (
    <div className="space-y-12 max-w-3xl mx-auto text-center">

      {/* ── Header ── */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-pc-accent">Privacy Policy</h1>
        <p className="text-pc-text-muted text-sm">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </section>

      {/* ── Sections ── */}
      <div className="space-y-6 text-left">
        {[
          {
            title: "1. Information We Collect",
            body: "When you create an account, we collect your email address and username. Game-related data (match history, player stats, ranked information) is sourced from the Hi-Rez Studios API and is publicly available information. We do not collect any personal data beyond what is necessary to operate your account.",
          },
          {
            title: "2. How We Use Your Information",
            body: "Your information is used solely to provide and improve PaladinsCat — including account authentication, personalised features, and service analytics. We do not sell, rent, or share your personal data with third parties for marketing or advertising purposes.",
          },
          {
            title: "3. Cookies & Local Storage",
            body: "We use essential cookies and local storage for authentication, session management, and user preferences (such as theme settings). We do not use tracking cookies, advertising pixels, or third-party analytics that profile your behaviour.",
          },
          {
            title: "4. Data Retention",
            body: "Account data is retained as long as your account is active. If you delete your account, your personal data is permanently removed within 30 days. Aggregated, anonymised stats may be retained for analytical purposes.",
          },
          {
            title: "5. Data Security",
            body: "We implement industry-standard security measures to protect your data, including encrypted connections, hashed passwords, and secure session management. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
          },
          {
            title: "6. Your Rights",
            body: "You have the right to access, correct, or delete your personal data at any time. You can manage your account settings directly or contact us for assistance with data requests.",
          },
          {
            title: "7. Third-Party Services",
            body: "Game data is retrieved from the Hi-Rez Studios API. Their handling of data is governed by their own privacy policy. PaladinsCat may contain links to external sites — we are not responsible for the privacy practices of those sites.",
          },
          {
            title: "8. Children's Privacy",
            body: "PaladinsCat is not intended for use by children under the age of 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal information, please contact us and we will delete it.",
          },
          {
            title: "9. Changes to This Policy",
            body: "We may update this privacy policy from time to time. We will notify users of significant changes. Continued use of PaladinsCat after changes constitutes acceptance of the updated policy.",
          },
          {
            title: "10. Contact",
            body: "For questions about this privacy policy or your personal data, reach out via our ",
            link: { text: "Discord server", href: "https://discord.gg/VqYMXAR" },
          },
        ].map((section) => (
          <div key={section.title} className="bg-pc-bg-elevated border border-pc-border rounded-xl p-5 hover:border-pc-accent-mid transition-colors">
            <h2 className="text-pc-text font-semibold text-sm mb-2">{section.title}</h2>
            <p className="text-pc-text-secondary text-sm leading-relaxed">
              {section.body}
              {section.link && (
                <a
                  href={section.link.href}
                  className="text-pc-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {section.link.text}
                </a>
              )}
              {section.link && "."}
            </p>
          </div>
        ))}
      </div>

      {/* ── Attribution ── */}
      <section className="border-t border-pc-border pt-8">
        <p className="text-pc-text-muted text-sm leading-relaxed">
          PaladinsCat is a fan-made project and is not affiliated with or endorsed by Hi-Rez Studios.
          All Paladins game content, including champion names, images, and assets, are property of
          Hi-Rez Studios.
        </p>
      </section>

    </div>
  );
}
