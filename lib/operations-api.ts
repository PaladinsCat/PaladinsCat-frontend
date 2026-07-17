const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface OperationsDailyPoint {
  date: string;
  visitors: number;
  pageViews: number;
  matches: number;
}

export interface PublicOperationsStats {
  generatedAt: string;
  release: { version: string; gitCommitShort: string; deployedAt: string | null };
  traffic: {
    visitorsToday: number;
    viewsToday: number;
    visitorDays7d: number;
    views7d: number;
    daily: OperationsDailyPoint[];
  };
  catalog: {
    matches: number;
    rankedMatches: number;
    casualMatches: number;
    players: number;
    registeredUsers: number;
    communityBuilds: number;
    tierLists: number;
    communityPosts: number;
    recoveredMatches: number;
    incompleteMatches: number;
    latestMatchAt: string | null;
  };
}

export async function fetchPublicOperationsStats(): Promise<PublicOperationsStats> {
  const response = await fetch(`${API_BASE}/operations/stats`);
  const raw = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof raw.error === "string" ? raw.error : `Request failed (${response.status})`);
  const summary = raw.traffic?.summary ?? {};
  const catalog = raw.catalog ?? {};
  return {
    generatedAt: String(raw.generated_at ?? ""),
    release: {
      version: String(raw.release?.version ?? ""),
      gitCommitShort: String(raw.release?.git_commit_short ?? ""),
      deployedAt: raw.release?.deployed_at == null ? null : String(raw.release.deployed_at),
    },
    traffic: {
      visitorsToday: Number(summary.visitors_today ?? 0),
      viewsToday: Number(summary.views_today ?? 0),
      visitorDays7d: Number(summary.visitor_days_7d ?? 0),
      views7d: Number(summary.views_7d ?? 0),
      daily: Array.isArray(raw.traffic?.daily) ? raw.traffic.daily.map((point: any) => ({
        date: String(point.date),
        visitors: Number(point.visitors ?? 0),
        pageViews: Number(point.page_views ?? 0),
        matches: Number(point.matches ?? 0),
      })) : [],
    },
    catalog: {
      matches: Number(catalog.matches ?? 0),
      rankedMatches: Number(catalog.ranked_matches ?? 0),
      casualMatches: Number(catalog.casual_matches ?? 0),
      players: Number(catalog.players ?? 0),
      registeredUsers: Number(catalog.registered_users ?? 0),
      communityBuilds: Number(catalog.community_builds ?? 0),
      tierLists: Number(catalog.tier_lists ?? 0),
      communityPosts: Number(catalog.community_posts ?? 0),
      recoveredMatches: Number(catalog.recovered_matches ?? 0),
      incompleteMatches: Number(catalog.incomplete_matches ?? 0),
      latestMatchAt: catalog.latest_match_at == null ? null : String(catalog.latest_match_at),
    },
  };
}
