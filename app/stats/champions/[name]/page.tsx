/** Render a shareable champion-specific statistics view.
 * refs: see: components/champion-matchups.tsx · see: app/stats/champions/page.tsx
 */
import ChampionMatchups from "@/components/champion-matchups";
/**
 * Resolve the promised route slug and render champion matchups.
 * I/O types: `{params: Promise<{name: string}>}` -> `Promise<React.JSX.Element>`.
 * refs: see: components/champion-matchups.tsx
 */
export default async function Page({params}: {params: Promise<{name: string}>}): Promise<React.JSX.Element> {
  const {name} = await params;
  return <ChampionMatchups initialSlug={name} />;
}
