"use client";

import ScrambleText from "@/components/ScrambleText";
import { useLocalization } from "@/lib/localization-context";

export default function PrivacyPage() {
  const { locale, t } = useLocalization();
  return (
    <div className="space-y-12 max-w-3xl mx-auto text-center">

      {/* ── Header ── */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-pc-accent">
          <ScrambleText text={t("generated.privacy.privacyPolicy")} speed={30} iterations={15} delayFromCenter={false} />
        </h1>
        <p className="text-pc-text-muted text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          {t("generated.privacy.lastUpdated")}{" "}{new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </section>

      {/* ── Sections ── */}
      <div className="space-y-6 text-left">
        {[
          {
            title: t("generated.privacy.text1InformationWeCollect"),
            body: t("generated.privacy.bodyInformationWeCollect"),
          },
          {
            title: t("generated.privacy.text2HowWeUseYourInformation"),
            body: t("generated.privacy.bodyHowWeUseYourInformation"),
          },
          {
            title: t("generated.privacy.text3CookiesLocalStorage"),
            body: t("generated.privacy.bodyCookies"),
          },
          {
            title: t("generated.privacy.text4DataRetention"),
            body: t("generated.privacy.bodyDataRetention"),
          },
          {
            title: t("generated.privacy.text5DataSecurity"),
            body: t("generated.privacy.bodySecurity"),
          },
          {
            title: t("generated.privacy.text6YourRights"),
            body: t("generated.privacy.bodyUserRights"),
          },
          {
            title: t("generated.privacy.text7ThirdPartyServices"),
            body: t("generated.privacy.bodyThirdParty"),
          },
          {
            title: t("generated.privacy.text8ChildrenSPrivacy"),
            body: t("generated.privacy.bodyChildren"),
          },
          {
            title: t("generated.privacy.text9ChangesToThisPolicy"),
            body: t("generated.privacy.bodyPolicyUpdates"),
          },
          {
            title: t("generated.privacy.text10Contact"),
            body: t("generated.privacy.bodyContact"),
            link: { text: t("generated.privacy.discordServer"), href: "https://discord.gg/VqYMXAR" },
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
          {t("generated.privacy.paladinscatIsAFanMadeProjectAndIsNotAffiliated")}</p>
      </section>

    </div>
  );
}
