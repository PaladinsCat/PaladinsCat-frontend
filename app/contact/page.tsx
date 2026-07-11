"use client";

import ScrambleText from "@/components/ScrambleText";

export default function ContactPage() {
  return (
    <div className="space-y-12 max-w-3xl mx-auto text-center">

      {/* ── Header ── */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-pc-accent">
          <ScrambleText text="Contact" speed={30} iterations={15} delayFromCenter={false} />
        </h1>
        <p className="text-pc-text-secondary drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          Have questions, feedback, or found a bug? We&apos;d love to hear from you.
        </p>
      </section>

      {/* ── Contact Methods ── */}
      <div className="space-y-6">
        {[
          {
            title: "Discord",
            desc: "The fastest way to reach us. Join the community, ask questions, report bugs, or just hang out.",
            cta: "Join Discord",
            href: "https://discord.gg/VqYMXAR",
            primary: true,
          },
          {
            title: "Email",
            desc: "For business inquiries, partnerships, or anything else — drop us a line directly.",
            cta: "nabicook@proton.me",
            href: "mailto:nabicook@proton.me",
            primary: false,
          },
        ].map((method) => (
          <div key={method.title} className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6 hover:border-pc-accent-mid transition-colors">
            <h2 className="text-pc-text font-semibold text-sm mb-2">{method.title}</h2>
            <p className="text-pc-text-secondary text-sm leading-relaxed mb-4">{method.desc}</p>
            <a
              href={method.href}
              target={method.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={method.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                method.primary
                  ? "bg-pc-accent text-pc-bg hover:bg-pc-accent-secondary"
                  : "border border-pc-border text-pc-text hover:border-pc-accent hover:text-pc-accent"
              }`}
            >
              {method.cta}
            </a>
          </div>
        ))}
      </div>

      {/* ── Note ── */}
      <section className="border-t border-pc-border pt-8">
        <p className="text-pc-text-muted text-sm leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          PaladinsCat is a community project run by volunteers. We do our best to respond quickly,
          but please be patient — we&apos;re all Paladins players too.
        </p>
      </section>

    </div>
  );
}
