/**
 * Render the localized terms page with its dated acceptance sections.  Returns: `Promise<React.JSX.Element>`. · refs: none
 * refs: none
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
  ShieldCheck,
} from "lucide-react";
import PublicPolicyPage, { type PublicPolicySection } from "@/components/PublicPolicyPage";
import { getServerLocalization } from "@/lib/server-localization";

const POLICY_DATE = new Date(Date.UTC(2026, 8, 10));

/**
 * Render the localized terms page with its dated acceptance sections.  Returns: `Promise<React.JSX.Element>`. · refs: none
 * I/O types: `none -> Promise<JSX.Element>`.
 */
export default async function TermsPage() {
  const { locale, t } = await getServerLocalization();
  const sections: PublicPolicySection[] = [
    { id: "acceptance", title: t("generated.terms.text1AcceptanceOfTerms"), body: t("generated.terms.bodyAcceptanceOfTerms"), icon: BadgeCheck },
    { id: "service", title: t("generated.terms.text2UseOfTheService"), body: t("generated.terms.bodyUseOfTheService"), icon: Globe2 },
    { id: "accounts", title: t("generated.terms.text3UserAccounts"), body: t("generated.terms.bodyUserAccounts"), icon: KeyRound },
    { id: "privacy", title: t("generated.terms.text3aPrivacy"), body: t("generated.terms.bodyPrivacy"), icon: ShieldCheck, link: { href: "/privacy", label: t("generated.terms.privacyPolicy") } },
    { id: "intellectual-property", title: t("generated.terms.text4IntellectualProperty"), body: t("generated.terms.bodyIntellectualProperty"), icon: Scale },
    { id: "hirez-paladins", title: t("generated.terms.text4aHiRezPaladinsNotice"), body: t("generated.terms.bodyHiRezPaladinsNotice"), icon: Scale, link: { href: "https://store.steampowered.com/eula/444090_eula_0", label: t("generated.terms.paladinsEula") } },
    { id: "user-content", title: t("generated.terms.text5UserContent"), body: t("generated.terms.bodyUserContent"), icon: MessageSquareText },
    { id: "disclaimers", title: t("generated.terms.text6LimitationOfLiability"), body: t("generated.terms.bodyLimitationOfLiability"), icon: AlertTriangle },
    { id: "third-parties", title: t("generated.terms.text7ThirdPartyServices"), body: t("generated.terms.bodyThirdPartyServices"), icon: Gavel },
    { id: "moderation", title: t("generated.terms.text8Termination"), body: t("generated.terms.bodyTermination"), icon: Ban },
    { id: "changes", title: t("generated.terms.text9ChangesToTerms"), body: t("generated.terms.bodyChangesToTerms"), icon: FilePenLine },
    { id: "contact", title: t("generated.terms.text10Contact"), body: t("generated.terms.bodyContact"), icon: Send, link: { href: "mailto:nabicook@proton.me?subject=Terms%20or%20privacy%20question", label: "nabicook@proton.me" } },
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
