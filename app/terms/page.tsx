"use client";

import ScrambleText from "@/components/ScrambleText";

export default function TermsPage() {
  return (
    <div className="space-y-12 max-w-3xl mx-auto text-center">

      {/* ── Header ── */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-pc-accent">
          <ScrambleText text="Terms of Use" speed={30} iterations={15} delayFromCenter={false} />
        </h1>
        <p className="text-pc-text-muted text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </section>

      {/* ── Sections ── */}
      <div className="space-y-6 text-left">
        {[
          {
            title: "1. Acceptance of Terms",
            body: "By accessing or using PaladinsCat, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, do not use the service.",
          },
          {
            title: "2. Use of the Service",
            body: "PaladinsCat provides stats and analytics for the game Paladins. The data is provided for informational purposes only. We make no guarantees regarding the accuracy or completeness of the data displayed. You agree not to misuse the service, attempt to disrupt it, or use it for any unlawful purpose.",
          },
          {
            title: "3. User Accounts",
            body: "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate information when registering and notify us immediately of any unauthorised use.",
          },
          {
            title: "4. Intellectual Property",
            body: "All Paladins game content, including champion names, images, and assets, are property of Hi-Rez Studios. PaladinsCat is a fan-made project and is not affiliated with or endorsed by Hi-Rez Studios. All original content, design, and code on PaladinsCat are owned by the project and may not be reproduced without permission.",
          },
          {
            title: "5. User Content",
            body: "Any content you submit to PaladinsCat — including community posts, comments, and builds — remains yours, but you grant us a non-exclusive license to display and distribute it within the platform. You are solely responsible for the content you post.",
          },
          {
            title: "6. Limitation of Liability",
            body: 'PaladinsCat is provided "as is" without warranties of any kind, express or implied. We shall not be liable for any damages arising from the use of this service, including but not limited to loss of data, inaccurate stats, or service interruptions.',
          },
          {
            title: "7. Third-Party Services",
            body: "PaladinsCat uses the Hi-Rez Studios API to retrieve game data. Your use of that data is also subject to Hi-Rez Studios' terms of service. We are not responsible for the availability or accuracy of third-party APIs.",
          },
          {
            title: "8. Termination",
            body: "We reserve the right to suspend or terminate your access to PaladinsCat at any time, with or without cause, including for violation of these terms.",
          },
          {
            title: "9. Changes to Terms",
            body: "We reserve the right to modify these terms at any time. We will notify users of significant changes. Continued use of the service after changes constitutes acceptance of the updated terms.",
          },
          {
            title: "10. Contact",
            body: 'If you have questions about these terms, reach out via our ',
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
        <p className="text-pc-text-muted text-sm leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          PaladinsCat is a fan-made project and is not affiliated with or endorsed by Hi-Rez Studios.
          All Paladins game content, including champion names, images, and assets, are property of
          Hi-Rez Studios.
        </p>
      </section>

    </div>
  );
}
