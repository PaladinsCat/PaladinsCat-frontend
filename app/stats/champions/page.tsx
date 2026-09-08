/** Render the champion matchup directory within the statistics family.
 * refs: see: components/champion-matchups.tsx · endpoints: GET /stats/champions/{champion_id}/matchups
 */
import ChampionMatchups from "@/components/champion-matchups";
/**
 * Render the roster and matchup browser.
 * I/O types: `()` -> `React.JSX.Element`; refs: see: components/champion-matchups.tsx
 */
export default function Page(): React.JSX.Element { return <ChampionMatchups />; }
