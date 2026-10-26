import { queryOptions } from "@tanstack/react-query";
import { listTeams, getTeam, getCategory } from "./sops.functions";

export const teamsQueryOptions = () =>
  queryOptions({
    queryKey: ["teams"],
    queryFn: () => listTeams(),
  });

export const teamQueryOptions = (teamId: string) =>
  queryOptions({
    queryKey: ["teams", teamId],
    queryFn: () => getTeam({ data: { teamId } }),
  });

export const categoryQueryOptions = (teamId: string, categoryId: string) =>
  queryOptions({
    queryKey: ["teams", teamId, "category", categoryId],
    queryFn: () => getCategory({ data: { teamId, categoryId } }),
  });
