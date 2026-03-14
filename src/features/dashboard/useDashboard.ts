import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/store";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { fetchSummary } from "@/services/api";
import { QUERY_KEYS } from "@/config/queryKeys";

export function useDashboard() {
  const { dateFrom, dateTo, project, client, user } = useFilterStore();
  const getScopedPod = useAuthStore((s) => s.getScopedPod);

  /* Auto-scope POD for tech_lead / team_member */
  const scopedPod = getScopedPod();
  const pod = scopedPod ?? useFilterStore.getState().pod;

  const params = { dateFrom, dateTo, project, pod, client, user };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.summary(params),
    queryFn: () => fetchSummary(params),
  });

  return {
    summary: data,
    isLoading,
    isError,
    error,
    refetch,
    byPod: data?.by_pod ?? [],
    byClient: data?.by_client ?? [],
    byUser: data?.by_user ?? [],
    totalHours: data?.total_hours ?? 0,
    totalTickets: data?.total_tickets ?? 0,
    isScopedToPod: !!scopedPod,
    scopedPod,
  };
}
