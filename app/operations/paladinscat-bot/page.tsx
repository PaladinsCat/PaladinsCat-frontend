import {
  Activity,
  Bot,
  Check,
  ExternalLink,
  Gamepad2,
  History,
  Image as ImageIcon,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserRoundSearch,
} from "lucide-react";
import { getServerLocalization } from "@/lib/server-localization";

const INVITE_URL = "https://discord.com/oauth2/authorize?client_id=1504377146020200539&permissions=52224&integration_type=0&scope=bot+applications.commands";

export default async function PaladinsCatBotPage() {
  const { t } = await getServerLocalization();

  const features = [
    { icon: UserRoundSearch, title: t("bot.featurePlayerTitle"), body: t("bot.featurePlayerBody"), command: "/player" },
    { icon: ImageIcon, title: t("bot.featureMatchTitle"), body: t("bot.featureMatchBody"), command: "/match" },
    { icon: History, title: t("bot.featureHistoryTitle"), body: t("bot.featureHistoryBody"), command: "/history" },
    { icon: Gamepad2, title: t("bot.featurePrepTitle"), body: t("bot.featurePrepBody"), command: "/loadout" },
  ];
  const commands = [
    ["/help", t("bot.commandHelp")],
    ["/player", t("bot.commandPlayer")],
    ["/match", t("bot.commandMatch")],
    ["/history", t("bot.commandHistory")],
    ["/current", t("bot.commandCurrent")],
    ["/loadout", t("bot.commandLoadouts")],
    ["/champion", t("bot.commandChampion")],
    ["/maps", t("bot.commandMaps")],
    ["/composition", t("bot.commandComposition")],
    ["/items", t("bot.commandItems")],
  ];

  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-pc-border bg-pc-bg-secondary/90 shadow-2xl backdrop-blur-sm">
      <section className="relative overflow-hidden border-b border-pc-border px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div className="pointer-events-none absolute -right-32 -top-36 h-96 w-96 rounded-full bg-[#5865f2]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 left-1/4 h-80 w-80 rounded-full bg-pc-accent/15 blur-3xl" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#5865f2]/40 bg-[#5865f2]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#aeb4ff]">
              <Bot className="h-4 w-4" aria-hidden="true" />
              {t("bot.eyebrow")}
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-pc-text sm:text-5xl lg:text-6xl">
              {t("bot.titleLead")} <span className="text-pc-accent">{t("bot.titleAccent")}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-pc-text-secondary sm:text-lg sm:leading-8">
              {t("bot.intro")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={INVITE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#5865f2] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#5865f2]/20 transition hover:bg-[#6873f5]"
              >
                <Bot className="h-5 w-5" aria-hidden="true" />
                {t("bot.invite")}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="#commands" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-pc-border bg-pc-bg-elevated/80 px-6 py-3 text-sm font-bold text-pc-text transition hover:border-pc-accent-mid hover:text-pc-accent">
                <Terminal className="h-4 w-4" aria-hidden="true" />
                {t("bot.viewCommands")}
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-pc-text-muted">
              {[t("bot.freeBadge"), t("bot.slashBadge"), t("bot.lightBadge")].map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-pc-accent" aria-hidden="true" />{badge}</span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#5865f2]/20 to-pc-accent/10 blur-xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111216] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-pc-accent/15">
                    <img src="/images/icons/paladinscat.avif" alt="" className="h-7 w-7 rounded-md" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#111216] bg-emerald-400" />
                  </span>
                  <span><span className="block text-sm font-bold text-white">{t("generated.common.paladinscat")}</span><span className="text-xs text-emerald-400">{t("bot.previewOnline")}</span></span>
                </div>
                <Sparkles className="h-5 w-5 text-[#aeb4ff]" aria-hidden="true" />
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                <div className="rounded-xl bg-white/[0.045] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">{t("bot.previewPrompt")}</p>
                  <div className="flex items-center gap-2 rounded-lg bg-[#222329] px-3 py-2.5 font-mono text-sm text-white">
                    <span className="text-[#aeb4ff]">{t("bot.previewCommand")}</span>
                    <span className="text-white/55">{t("bot.previewPlayerValue")}</span>
                  </div>
                </div>
                <div className="rounded-xl border-l-4 border-pc-accent bg-pc-accent/[0.08] p-4">
                  <div className="flex items-start gap-3">
                    <Search className="mt-0.5 h-5 w-5 shrink-0 text-pc-accent" aria-hidden="true" />
                    <div>
                      <p className="font-bold text-white">{t("bot.previewFound")}</p>
                      <p className="mt-1 text-sm leading-6 text-white/55">{t("bot.previewDetails")}</p>
                    </div>
                  </div>
                </div>
                <p className="px-1 text-xs leading-5 text-white/40">{t("bot.previewHint")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-pc-accent">{t("bot.featuresEyebrow")}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-pc-text sm:text-4xl">{t("bot.featuresTitle")}</h2>
          <p className="mt-4 leading-7 text-pc-text-secondary">{t("bot.featuresIntro")}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, body, command }) => (
            <article key={title} className="group relative overflow-hidden rounded-2xl border border-pc-border bg-pc-bg-elevated/70 p-6 transition hover:-translate-y-0.5 hover:border-pc-accent-mid">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-pc-accent/20 bg-pc-accent/10 text-pc-accent"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <code className="rounded-md border border-pc-border bg-pc-bg px-2 py-1 text-xs text-pc-accent-light">{command}</code>
              </div>
              <h3 className="mt-5 text-lg font-bold text-pc-text">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-pc-text-secondary">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="commands" className="border-y border-pc-border bg-pc-bg/60 px-5 py-14 sm:px-10 sm:py-20 lg:px-16 scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#aeb4ff]">{t("bot.commandsEyebrow")}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-pc-text sm:text-4xl">{t("bot.commandsTitle")}</h2>
            <p className="mt-4 leading-7 text-pc-text-secondary">{t("bot.commandsIntro")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {commands.map(([command, description]) => (
              <article key={command} className="rounded-xl border border-pc-border bg-pc-bg-elevated/80 p-4">
                <code className="text-sm font-bold text-pc-accent">{command}</code>
                <p className="mt-2 text-sm leading-6 text-pc-text-secondary">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
        <div className="grid overflow-hidden rounded-2xl border border-pc-accent/20 bg-gradient-to-br from-pc-accent/[0.10] to-[#5865f2]/[0.08] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex min-h-64 items-center justify-center border-b border-pc-border/70 p-10 lg:border-b-0 lg:border-r">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-pc-accent/20 bg-pc-bg-secondary shadow-2xl">
              <ShieldCheck className="h-16 w-16 text-pc-accent" aria-hidden="true" />
              <span className="absolute -right-1 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#5865f2]/30 bg-[#5865f2]/20"><Bot className="h-5 w-5 text-[#aeb4ff]" aria-hidden="true" /></span>
            </div>
          </div>
          <div className="p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-pc-accent">{t("bot.privacyEyebrow")}</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-pc-text sm:text-3xl">{t("bot.privacyTitle")}</h2>
            <p className="mt-4 leading-7 text-pc-text-secondary">{t("bot.privacyBody")}</p>
            <ul className="mt-6 space-y-3">
              {[t("bot.permissionCommands"), t("bot.permissionReplies"), t("bot.permissionNoChat")].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-pc-text"><Check className="mt-0.5 h-4 w-4 shrink-0 text-pc-accent" aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-pc-border px-5 py-14 text-center sm:px-10 sm:py-20 lg:px-16">
        <Activity className="mx-auto h-7 w-7 text-pc-accent" aria-hidden="true" />
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-pc-text sm:text-4xl">{t("bot.finalTitle")}</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-pc-text-secondary">{t("bot.finalBody")}</p>
        <a href={INVITE_URL} target="_blank" rel="noreferrer" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#5865f2] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#5865f2]/20 transition hover:bg-[#6873f5]">
          <Bot className="h-5 w-5" aria-hidden="true" />
          {t("bot.invite")}
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
        <p className="mt-4 text-xs text-pc-text-muted">{t("bot.finalNote")}</p>
      </section>
    </div>
  );
}
