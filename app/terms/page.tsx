/**
 * Define the terms page responsibility boundary.
 * Coordinates terms page data loading, authorization, and presentation.
 */
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  FilePenLine,
  Gavel,
  Globe2,
  KeyRound,
  MessageSquareText,
  Scale,
  Send,
} from "lucide-react";
import PublicPolicyPage, { type PublicPolicySection } from "@/components/PublicPolicyPage";
import { getServerLocalization } from "@/lib/server-localization";

const POLICY_DATE = new Date(Date.UTC(2026, 6, 22));

/** Render the localized terms page with its dated acceptance sections. */
export default async function TermsPage() {
  const { locale, t } = await getServerLocalization();
  const sections: PublicPolicySection[] = [
    { id: "acceptance", title: t("generated.terms.text1AcceptanceOfTerms"), body: t("generated.terms.bodyAcceptanceOfTerms"), icon: BadgeCheck },
    { id: "service", title: t("generated.terms.text2UseOfTheService"), body: t("generated.terms.bodyUseOfTheService"), icon: Globe2 },
    { id: "accounts", title: t("generated.terms.text3UserAccounts"), body: t("generated.terms.bodyUserAccounts"), icon: KeyRound },
    { id: "intellectual-property", title: t("generated.terms.text4IntellectualProperty"), body: t("generated.terms.bodyIntellectualProperty"), icon: Scale },
    { id: "user-content", title: t("generated.terms.text5UserContent"), body: t("generated.terms.bodyUserContent"), icon: MessageSquareText },
    { id: "disclaimers", title: t("generated.terms.text6LimitationOfLiability"), body: t("generated.terms.bodyLimitationOfLiability"), icon: AlertTriangle },
    { id: "third-parties", title: t("generated.terms.text7ThirdPartyServices"), body: t("generated.terms.bodyThirdPartyServices"), icon: Gavel },
    { id: "moderation", title: t("generated.terms.text8Termination"), body: t("generated.terms.bodyTermination"), icon: Ban },
    { id: "changes", title: t("generated.terms.text9ChangesToTerms"), body: t("generated.terms.bodyChangesToTerms"), icon: FilePenLine },
    { id: "contact", title: t("generated.terms.text10Contact"), body: t("generated.terms.bodyContact"), icon: Send, link: { href: "https://discord.gg/VqYMXAR", label: t("generated.terms.discordServer") } },
  ];

  return <PublicPolicyPage
    eyebrow={t("generated.terms.eyebrow")}
    title={t("generated.terms.termsOfUse")}
    intro={t("generated.terms.heroIntro")}
    updatedLabel={t("generated.terms.lastUpdated")}
    updatedDate={POLICY_DATE.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}
    badges={[t("generated.terms.badgeData"), t("generated.terms.badgeCommunity"), t("generated.terms.badgeAvailability")]}
    sections={sections}
    notice={t("generated.terms.paladinscatIsAFanMadeProjectAndIsNotAffiliated")}
  />;
}
