"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TierListEditor from "@/components/tier-list-editor";
import { LoadingPanel } from "@/components/async-state";
import { getAuthUser } from "@/lib/api-client";
import { fetchTierList, type TierListSummary } from "@/lib/tierlists-api";
import { useLocalization } from "@/lib/localization-context";

export default function EditTierListPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLocalization();
  const router = useRouter();
  const [list, setList] = useState<TierListSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const user = getAuthUser();
    if (!user) {
      router.replace("/auth/login");
      return () => { active = false; };
    }
    void params
      .then(({ id }) => fetchTierList(Number(id)))
      .then((tierList) => {
        if (!active) return;
        if (user.id !== tierList.userId && !user.isAdmin) {
          setError(t("tierLists.editForbidden"));
          return;
        }
        setList(tierList);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : t("tierLists.updateError"));
      });
    return () => { active = false; };
  }, [params, router, t]);

  if (error) return <div className="py-12 text-center text-sm text-rose-300">{error}</div>;
  if (!list) return <LoadingPanel />;
  return <TierListEditor initialList={list} />;
}
