"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Card from "@/components/Card";
import {
  fetchChampions,
  fetchRankedLeaderboard,
  fetchStatsChampions,
  type Champion,
  type RankedPlayer,
  type StatsChampion,
} from "@/lib/api-client";

export default function HomePage() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [statsChampions, setStatsChampions] = useState<StatsChampion[]>([]);
  const [rankedPlayers, setRankedPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [champs, stats, players] = await Promise.all([
          fetchChampions(),
          fetchStatsChampions({ sort: "win_rate", limit: 26 }),
          fetchRankedLeaderboard({ tier: "26", top: 20 }),
        ]);
       setChampions(champs);
        setStatsChampions(stats);
        setRankedPlayers(players);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Merge stats into champions by id (stats has winRate, banRate; champions has roles)
  const statsMap = new Map(statsChampions.map((s) => [s.championId, s]));
  const merged = champions.map((c) => {
    const s = statsMap.get(c.id);
    return { ...c, winRate: s?.winRate ?? c.winRate, banRate: s?.banRate };
  });

  // Define champion role map for later use in most banned section
  const champRoleMap = new Map(champions.map((c) => [c.id, c.roles]));

  // Most banned overall - use stats directly since /champions doesn't have ban_rate
  const topBannedStats = [...statsChampions]
    .sort((a, b) => (b.banRate ?? 0) - (a.banRate ?? 0))
    .slice(0, 5);

  // Top 3 by win rate per role/class
  const roles = ["Damage", "Flank", "Frontline", "Support"];
  const topByRole: { role: string; entries: (typeof merged)[number][] }[] =
    roles.map((role) => {
      const inRole = merged.filter((c) => c.roles?.includes(role));
      return {
        role,
        entries: inRole
          .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
          .slice(0, 4),
      };
    });

  // Transform stats-based banned champions into display-friendly format with roles
  const topBanned = topBannedStats.map((s) => ({
    id: s.championId,
    name: s.championName,
    banRate: s.banRate,
    roles: champRoleMap.get(s.championId),
  }));

  const [searchHovered, setSearchHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const roleNameToFilename: Record<string, string> = {
    Frontline: "Class_Front_Line_Icon.avif",
  };

  function roleIconSrc(role: string) {
    const filename = roleNameToFilename[role] ?? `Class_${role}_Icon.avif`;
    return `/images/icons/${filename}`;
  }

  const iconMap: Record<string, string> = {
    Androxus: "/images/champions/Champion Androxus Icon.avif",
    Atlas: "/images/champions/Champion Atlas Icon.avif",
    Ash: "/images/champions/Champion Ash Icon.avif",
    Azaan: "/images/champions/Champion Azaan Icon.avif",
    Barik: "/images/champions/Champion Barik Icon.avif",
    Barry: "/images/champions/Champion Barry Icon.avif",
    BettyLaBomba: "/images/champions/Champion BettyLaBomba Icon.avif",
    BombKing: "/images/champions/Champion BombKing Icon.avif",
    Buck: "/images/champions/Champion Buck Icon.avif",
    Cassie: "/images/champions/Champion Cassie Icon.avif",
    Caspian: "/images/champions/Champion Caspian Icon.avif",
    Corvus: "/images/champions/Champion Corvus Icon.avif",
    Daria: "/images/champions/Champion Daria Icon.avif",
    Dredge: "/images/champions/Champion Dredge Icon.avif",
    Drogoz: "/images/champions/Champion Drogoz Icon.avif",
    Evie: "/images/champions/Champion Evie Icon.avif",
    Fenrir: "/images/champions/Champion Fenrir Icon.avif",
    Fernando: "/images/champions/Champion Fernando Icon.avif",
    Furia: "/images/champions/Champion Furia Icon.avif",
    Grohk: "/images/champions/Champion Grohk Icon.avif",
    Grover: "/images/champions/Champion Grover Icon.avif",
    Imani: "/images/champions/Champion Imani Icon.avif",
    Inara: "/images/champions/Champion Inara Icon.avif",
    Io: "/images/champions/Champion Io Icon.avif",
    Jenos: "/images/champions/Champion Jenos Icon.avif",
    Kasumi: "/images/champions/Champion Kasumi Icon.avif",
    Khan: "/images/champions/Champion Khan Icon.avif",
    Kinessa: "/images/champions/Champion Kinessa Icon.avif",
    Koga: "/images/champions/Champion Koga Icon.avif",
    Lex: "/images/champions/Champion Lex Icon.avif",
    Lin: "/images/champions/Champion Lin Icon.avif",
    Lian: "/images/champions/Champion Lian Icon.avif",
    Lillith: "/images/champions/Champion Lillith Icon.avif",
    "Mal'Damba": "/images/champions/Champion Mal'Damba Icon.avif",
    Maeve: "/images/champions/Champion Maeve Icon.avif",
    Makoa: "/images/champions/Champion Makoa Icon.avif",
    Moji: "/images/champions/Champion Moji Icon.avif",
    Nyx: "/images/champions/Champion Nyx Icon.avif",
    Octavia: "/images/champions/Champion Octavia Icon.avif",
    Omen: "/images/champions/Champion Omen Icon.avif",
    Pip: "/images/champions/Champion Pip Icon.avif",
    Raum: "/images/champions/Champion Raum Icon.avif",
    Rei: "/images/champions/Champion Rei Icon.avif",
    Ruckus: "/images/champions/Champion Ruckus Icon.avif",
    Saati: "/images/champions/Champion Saati Icon.avif",
    Seris: "/images/champions/Champion Seris Icon.avif",
    ShaLin: "/images/champions/Champion ShaLin Icon.avif",
    Skye: "/images/champions/Champion Skye Icon.avif",
    Strix: "/images/champions/Champion Strix Icon.avif",
    Talus: "/images/champions/Champion Talus Icon.avif",
    Terminus: "/images/champions/Champion Terminus Icon.avif",
    Tiberius: "/images/champions/Champion Tiberius Icon.avif",
    Torvald: "/images/champions/Champion Torvald Icon.avif",
    Tyra: "/images/champions/Champion Tyra Icon.avif",
    Vatu: "/images/champions/Champion Vatu Icon.avif",
    VII: "/images/champions/Champion VII Icon.avif",
    Viktor: "/images/champions/Champion Viktor Icon.avif",
    Vivian: "/images/champions/Champion Vivian Icon.avif",
    Vora: "/images/champions/Champion Vora Icon.avif",
    Willo: "/images/champions/Champion Willo Icon.avif",
    Yagorath: "/images/champions/Champion Yagorath Icon.avif",
    Ying: "/images/champions/Champion Ying Icon.avif",
    Zhin: "/images/champions/Champion Zhin Icon.avif",
  };

  return (
    <div className="relative min-h-screen">
      {/* Background image with fade-in — positioned absolute behind z-10 content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          backgroundImage: `url("/images/maps/Fish Market Overhead.png")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
         filter: "brightness(0.25)",
        }}
       />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-[1400px]">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="text-center mb-12"
        >
          {/* Cat logo image above title */}
          <Image 
            src="/images/icons/paladinscat.avif" 
            alt="PaladinsCat logo"
            width={80}
            height={80}
            className="mx-auto mb-2 opacity-90"
          />
          <h1 className="text-4xl font-semibold tracking-wide">
            <ScrambleText 
              text="PaladinsCat" 
              speed={50} 
              iterations={3} 
              delayFromCenter={false}
            />
          </h1>
          <p className="text-xs text-pc-text-muted mt-1">
            Paladins: Comp Analytics Tool - advanced statistic, or just meow.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-md mx-auto mb-16"
        >
          <form
            action="/search"
            method="GET"
            onMouseEnter={() => setSearchHovered(true)}
            onMouseLeave={() => setSearchHovered(false)}
            onSubmit={(e) => {
              if (searchValue.trim() === "") {
                e.preventDefault();
                return;
              }
            }}
            className={`group relative rounded-lg border transition-all duration-200 ease-out hover:scale-[1.02] hover:border-pc-accent-mid hover:bg-[#202127] hover:shadow-[0_10px_26px_rgba(51,182,177,0.14)] focus-within:scale-[1.02] focus-within:border-pc-accent-mid focus-within:bg-[#202127] focus-within:shadow-[0_10px_26px_rgba(51,182,177,0.14)] ${
              searchHovered || searchFocused
                ? "scale-[1.02] border-pc-accent-mid bg-[#202127] shadow-[0_10px_26px_rgba(51,182,177,0.14)]"
                : "border-white/5 bg-[#1a1d23]"
            }`}
          >
            {/* Search input */}
            <input
              type="text"
              name="q"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search players, champions, matches..."
              className={`w-full bg-transparent px-4 py-2 text-sm text-pc-text outline-none rounded-lg pr-16 transition-colors placeholder:text-pc-text-muted`}
            />
            {/* Clear button - appears when search has text */}
            {searchValue.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="absolute inset-y-0 right-10 flex items-center text-pc-text-muted hover:text-white transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
            {/* Magnifying glass icon on right side */}
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={`transition-colors ${
                  searchHovered || searchFocused
                    ? "text-pc-accent"
                    : "text-pc-text-muted group-hover:text-pc-accent group-focus-within:text-pc-accent"
                }`}
              >
                <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></path>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </form>
        </motion.div>

        {/* Content Grid — centered two-column layout */}
        <div className="flex flex-col lg:flex-row justify-center items-stretch lg:items-start gap-6 max-w-[95%] mx-auto">
          {/* Left Column - Meta Cards stacked vertically */}
          <div className="w-full flex-1 min-w-0 lg:min-w-[320px] space-y-6">
            {/* Consolidated Top Win Rate Card with role tabs */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card style={{ maxWidth: 'none' }}>
                <div className="pc-card-title mb-4">
                  <ScrambleText
                    text="Top Win Rate"
                    speed={45}
                    iterations={3}
                    delayFromCenter={false}
                  />
                </div>
                
                {loading ? (
                  <div className="space-y-3">
                    {/* Skeleton placeholders for champion grid */}
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                  </div>
                ) : topByRole.every(({ entries }) => entries.length === 0) ? (
                  <p className="pc-body text-sm">
                    <ScrambleText
                      text="No data available yet."
                      speed={35}
                      iterations={3}
                      delayFromCenter={false}
                    />
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {topByRole.map(({ role, entries }) => (
                      <div key={role} className="space-y-3">
                        {/* Role header with icon */}
                        <div className="flex items-center gap-2 mb-2 border-b border-pc-border pb-1">
                          <Image
                            src={roleIconSrc(role)}
                            alt={`${role} role icon`}
                            width={20}
                            height={20}
                            style={{ opacity: 0.85 }}
                          />
                          <span className="text-sm font-medium text-pc-text-muted">
                            {role}
                          </span>
                        </div>
                        
                        {/* Champion portraits in 4-column grid */}
                        <div className="grid grid-cols-4 gap-x-3 gap-y-4">
                          {entries.map((champ) => (
                            <Link 
                              key={champ.id} 
                              href={`/champions/${champ.id}`}
                              className="group flex min-w-0 flex-col items-center gap-1 text-center"
                            >
                              {/* Champion portrait */}
                              <Image
                                src={iconMap[champ.name] || ""}
                                alt={`${champ.name} icon`}
                                width={48}
                                height={48}
                                className="rounded-lg group-hover:ring-2 ring-pc-accent transition-all"
                              />
                              {/* Champion name */}
                              <span className="max-w-full truncate text-xs leading-tight text-pc-text-muted group-hover:text-pc-accent transition-colors">
                                {champ.name}
                              </span>
                              {/* Win rate percentage */}
                              <span className="text-xs font-mono text-pc-text-muted">
                                {champ.winRate != null ? `${champ.winRate.toFixed(1)}%` : "N/A"}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Most Banned Card */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card>
                <div className="pc-card-title mb-3">
                  <ScrambleText
                    text="Most Banned"
                    speed={45}
                    iterations={3}
                    delayFromCenter={false}
                  />
                </div>

                {loading ? (
                  <div className="space-y-3">
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                  </div>
                ) : topBanned.length === 0 ? (
                  <p className="pc-body text-sm">
                    <ScrambleText
                      text="No ban data available yet."
                      speed={35}
                      iterations={3}
                      delayFromCenter={false}
                    />
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topBanned.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between"
                      >
                        <Link
                          href={`/champions/`}
                          className="text-pc-text hover:text-pc-accent transition-colors text-sm font-medium"
                        >
                          {c.name}
                        </Link>
                        <span className="pc-badge">
                          {c.banRate != null
                            ? `${(c.banRate * 100).toFixed(2)}%`
                            : "???"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Ranked Leaderboard (Tier 26 / Master, Top 20) */}
          <div className="w-full flex-1 min-w-0 lg:min-w-[300px] lg:max-w-md space-y-6 lg:flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card>
                <div className="pc-card-title mb-3">Leaderboard</div>

                {loading ? (
                  <div className="space-y-3">
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                    <div className="pc-skeleton h-10 w-full" />
                  </div>
                ) : rankedPlayers.length === 0 ? (
                  <p className="pc-body text-sm">
                    <ScrambleText
                      text="No data yet"
                      speed={35}
                      iterations={3}
                      delayFromCenter={false}
                    />
                  </p>
                ) : (
                  <div className="min-w-0">
                    <table className="pc-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Player</th>
                          <th>Points</th>
                          <th>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankedPlayers.map((player) => {
                          const trend = player.trend ?? 0;
                          const trendIcon =
                            trend > 0 ? "↑" : trend < 0 ? "↓" : "-";
                          const trendColor =
                            trend > 0
                              ? "#4ade80"
                              : trend < 0
                                ? "#f87171"
                                : "#9ca3af";
                          return (
                            <tr key={player.player_id}>
                              <td className="text-pc-text-muted text-sm">
                                {player.rank}
                              </td>
                              <td>
                                <Link
                                  href={`/players/`}
                                  className="text-pc-text hover:text-pc-accent transition-colors"
                                >
                                  {player.name}
                                </Link>
                              </td>
                              <td>{player.points.toLocaleString()}</td>
                              <td
                                style={{ color: trendColor }}
                                className="text-sm"
                              >
                                {trendIcon}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}























































