"use client";

import ScrambleText from "@/components/ScrambleText";
import { useLocalization } from "@/lib/localization-context";

export default function TermsPage() {
  const { locale, t } = useLocalization();
  return (
    <div className="space-y-12 max-w-3xl mx-auto text-center">

      {/* ── Header ── */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-pc-accent">
          <ScrambleText text={t("generated.terms.termsOfUse")} speed={30} iterations={15} delayFromCenter={false} />
        </h1>
        <p className="text-pc-text-muted text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          {t("generated.terms.lastUpdated")}{" "}{new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </section>

      {/* ── Sections ── */}
      <div className="space-y-6 text-left">
        {[
          {
            title: t("generated.terms.text1AcceptanceOfTerms"),
            body: t("generated.terms.bodyAcceptanceOfTerms"),
          },
          {
            title: t("generated.terms.text2UseOfTheService"),
            body: t("generated.terms.bodyUseOfTheService"),
          },
          {
            title: t("generated.terms.text3UserAccounts"),
            body: t("generated.terms.bodyUserAccounts"),
          },
          {
            title: t("generated.terms.text4IntellectualProperty"),
            body: t("generated.terms.bodyIntellectualProperty"),
          },
          {
            title: t("generated.terms.text5UserContent"),
            body: t("generated.terms.bodyUserContent"),
          },
          {
            title: t("generated.terms.text6LimitationOfLiability"),
            body: t("generated.terms.bodyLimitationOfLiability"),
          },
          {
            title: t("generated.terms.text7ThirdPartyServices"),
            body: t("generated.terms.bodyThirdPartyServices"),
          },
          {
            title: t("generated.terms.text8Termination"),
            body: t("generated.terms.bodyTermination"),
          },
          {
            title: t("generated.terms.text9ChangesToTerms"),
            body: t("generated.terms.bodyChangesToTerms"),
          },
          {
            title: t("generated.terms.text10Contact"),
            body: t("generated.terms.bodyContact"),
            link: { text: t("generated.terms.discordServer"), href: "https://discord.gg/VqYMXAR" },
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
          {t("generated.terms.paladinscatIsAFanMadeProjectAndIsNotAffiliated")}</p>
      </section>

    </div>
  );
}
