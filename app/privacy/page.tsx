"use client";

import ScrambleText from "@/components/ScrambleText";
import { useLocalization } from "@/lib/localization-context";

export default function PrivacyPage() {
  const { t } = useLocalization();
  return (
    <div className="space-y-12 max-w-3xl mx-auto text-center">

      {/* ── Header ── */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-pc-accent">
          <ScrambleText text={t("generated.privacy.privacyPolicy")} speed={30} iterations={15} delayFromCenter={false} />
        </h1>
        <p className="text-pc-text-muted text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          {t("generated.privacy.lastUpdated")}{" "}{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </section>

      {/* ── Sections ── */}
      <div className="space-y-6 text-left">
        {[
          {
            title: t("generated.privacy.text1InformationWeCollect"),
            body: "When you create an account, we collect your email address and username. Game-related data (match history, player stats, ranked information) is sourced from the Hi-Rez Studios API and is publicly available information. We also count page views and daily visitors using an anonymous browser identifier that is hashed before server storage; raw identifiers and IP addresses are not retained for analytics.",
          },
          {
            title: t("generated.privacy.text2HowWeUseYourInformation"),
            body: "Your information is used solely to provide and improve PaladinsCat — including account authentication, personalised features, and service analytics. We do not sell, rent, or share your personal data with third parties for marketing or advertising purposes.",
          },
          {
            title: t("generated.privacy.text3CookiesLocalStorage"),
            body: "We use essential cookies and local storage for authentication, session management, user preferences, and one random first-party identifier used to calculate anonymous daily traffic. We do not use advertising pixels or third-party behavioural analytics, and browser Do Not Track requests disable this traffic measurement.",
          },
          {
            title: t("generated.privacy.text4DataRetention"),
            body: "Account data is retained as long as your account is active. If you delete your account, your personal data is permanently removed within 30 days. Aggregated, anonymised stats may be retained for analytical purposes.",
          },
          {
            title: t("generated.privacy.text5DataSecurity"),
            body: "We implement industry-standard security measures to protect your data, including encrypted connections, hashed passwords, and secure session management. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
          },
          {
            title: t("generated.privacy.text6YourRights"),
            body: "You have the right to access, correct, or delete your personal data at any time. You can manage your account settings directly or contact us for assistance with data requests.",
          },
          {
            title: t("generated.privacy.text7ThirdPartyServices"),
            body: "Game data is retrieved from the Hi-Rez Studios API. Their handling of data is governed by their own privacy policy. PaladinsCat may contain links to external sites — we are not responsible for the privacy practices of those sites.",
          },
          {
            title: t("generated.privacy.text8ChildrenSPrivacy"),
            body: "PaladinsCat is not intended for use by children under the age of 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal information, please contact us and we will delete it.",
          },
          {
            title: t("generated.privacy.text9ChangesToThisPolicy"),
            body: "We may update this privacy policy from time to time. We will notify users of significant changes. Continued use of PaladinsCat after changes constitutes acceptance of the updated policy.",
          },
          {
            title: t("generated.privacy.text10Contact"),
            body: "For questions about this privacy policy or your personal data, reach out via our ",
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
