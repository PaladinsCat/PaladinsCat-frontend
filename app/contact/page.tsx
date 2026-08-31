/**
 * Define the contact page responsibility boundary.
 * Coordinates contact page data loading, authorization, and presentation.
 */
"use client";
import ScrambleText from "@/components/ScrambleText";
import { useLocalization } from "@/lib/localization-context";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export default function ContactPage() {
  const { t } = useLocalization();
  return (
    <div className="space-y-12 max-w-3xl mx-auto text-center">

      {/* ── Header ── */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-pc-accent">
          <ScrambleText text={t("generated.contact.contact")} speed={30} iterations={15} delayFromCenter={false} />
        </h1>
        <p className="text-pc-text-secondary drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          {t("generated.contact.haveQuestionsFeedbackOrFoundABugWeDLove")}</p>
      </section>

      {/* ── Contact Methods ── */}
      <div className="space-y-6">
        {[
          {
            title: t("generated.contact.discord"),
            desc: t("generated.contact.discordDesc"),
            cta: t("footer.joinDiscord"),
            href: "https://discord.gg/VqYMXAR",
            primary: true,
          },
          {
            title: t("generated.contact.email"),
            desc: t("generated.contact.emailDesc"),
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
          {t("generated.contact.paladinscatIsACommunityProjectRunByVolunteersWeDo")}</p>
      </section>

    </div>
  );
}
