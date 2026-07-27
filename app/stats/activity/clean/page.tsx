"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingPanel } from "@/components/async-state";
import PlayerActivityPanel from "@/components/player-activity-panel";
import { useAuth } from "@/lib/auth-context";

export default function CleanPlayerActivityPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isVerified = Boolean(user?.linkedPlayerId);

  useEffect(() => {
    if (!isLoading && !isVerified) {
      router.replace("/stats/activity");
    }
  }, [isLoading, isVerified, router]);

  if (isLoading || !isVerified) {
    return <div className="mx-auto w-full max-w-6xl">
      <LoadingPanel compact className="min-h-[24rem]" />
    </div>;
  }

  return <div className="pc-player-activity-clean-page">
    <PlayerActivityPanel showStatements={false} />
  </div>;
}
