/**
 * Define the privacy page responsibility boundary.
 * Coordinates privacy page data loading, authorization, and presentation.
 */
import {
  Baby,
  Cookie,
  Database,
  FileClock,
  FilePenLine,
  KeyRound,
  Send,
  ShieldCheck,
  UserRoundCheck,
  Waypoints,
} from "lucide-react";
import PublicPolicyPage, { type PublicPolicySection } from "@/components/PublicPolicyPage";
import { getServerLocalization } from "@/lib/server-localization";

const POLICY_DATE = new Date(Date.UTC(2026, 6, 22));

/** Render the localized privacy policy with its dated policy sections. */
export default async function PrivacyPage() {
  const { locale, t } = await getServerLocalization();
  const sections: PublicPolicySection[] = [
    { id: "collection", title: t("generated.privacy.text1InformationWeCollect"), body: t("generated.privacy.bodyDataCollection"), icon: Database },
    { id: "use", title: t("generated.privacy.text2HowWeUseYourInformation"), body: t("generated.privacy.bodyHowWeUseYourInformation"), icon: UserRoundCheck },
    { id: "browser-storage", title: t("generated.privacy.text3CookiesLocalStorage"), body: t("generated.privacy.bodyCookies"), icon: Cookie },
    { id: "retention", title: t("generated.privacy.text4DataRetention"), body: t("generated.privacy.bodyDataRetention"), icon: FileClock },
    { id: "security", title: t("generated.privacy.text5DataSecurity"), body: t("generated.privacy.bodySecurity"), icon: KeyRound },
    { id: "choices", title: t("generated.privacy.text6YourRights"), body: t("generated.privacy.bodyUserRights"), icon: ShieldCheck },
    { id: "third-parties", title: t("generated.privacy.text7ThirdPartyServices"), body: t("generated.privacy.bodyThirdParty"), icon: Waypoints },
    { id: "children", title: t("generated.privacy.text8ChildrenSPrivacy"), body: t("generated.privacy.bodyChildren"), icon: Baby },
    { id: "changes", title: t("generated.privacy.text9ChangesToThisPolicy"), body: t("generated.privacy.bodyPolicyUpdates"), icon: FilePenLine },
    { id: "contact", title: t("generated.privacy.text10Contact"), body: t("generated.privacy.bodyContact"), icon: Send, link: { href: "https://discord.gg/VqYMXAR", label: t("generated.privacy.discordServer") } },
  ];

  return <PublicPolicyPage
    eyebrow={t("generated.privacy.eyebrow")}
    title={t("generated.privacy.privacyPolicy")}
    intro={t("generated.privacy.heroIntro")}
    updatedLabel={t("generated.privacy.lastUpdated")}
    updatedDate={POLICY_DATE.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}
    badges={[t("generated.privacy.badgeNoSale"), t("generated.privacy.badgeLocalFirst"), t("generated.privacy.badgeDnt")]}
    sections={sections}
    notice={t("generated.privacy.paladinscatIsAFanMadeProjectAndIsNotAffiliated")}
  />;
}
