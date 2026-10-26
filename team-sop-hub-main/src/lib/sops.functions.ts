import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type SopRow = Database["public"]["Tables"]["sops"]["Row"];

export type TeamSummary = TeamRow & { categoryCount: number; sopCount: number };
export type CategoryWithCount = CategoryRow & { sopCount: number };
export type TeamDetail = {
  team: TeamRow;
  categories: CategoryWithCount[];
  directSops: SopRow[];
};
export type CategoryDetail = {
  team: TeamRow | null;
  category: CategoryRow;
  sops: SopRow[];
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    // Opaque sb_ keys aren't JWTs; send only apikey, not the default Authorization bearer.
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const listTeams = createServerFn({ method: "GET" }).handler(
  async (): Promise<TeamSummary[]> => {
    const db = publicClient();
    const [teamsRes, catsRes, sopsRes] = await Promise.all([
      db.from("teams").select("*").order("created_at", { ascending: true }),
      db.from("categories").select("id, team_id"),
      db.from("sops").select("id, team_id, category_id"),
    ]);
    fail(teamsRes.error);
    fail(catsRes.error);
    fail(sopsRes.error);
    return (teamsRes.data ?? []).map((t) => ({
      ...t,
      categoryCount: (catsRes.data ?? []).filter((c) => c.team_id === t.id).length,
      sopCount: (sopsRes.data ?? []).filter((s) => s.team_id === t.id).length,
    }));
  },
);

export const getTeam = createServerFn({ method: "GET" })
  .inputValidator((input: { teamId: string }) => input)
  .handler(async ({ data }): Promise<TeamDetail | null> => {
    const db = publicClient();
    const [teamRes, catsRes, sopsRes] = await Promise.all([
      db.from("teams").select("*").eq("id", data.teamId).maybeSingle(),
      db.from("categories").select("*").eq("team_id", data.teamId).order("created_at", { ascending: true }),
      db.from("sops").select("*").eq("team_id", data.teamId).order("created_at", { ascending: true }),
    ]);
    fail(teamRes.error);
    fail(catsRes.error);
    fail(sopsRes.error);
    const team = teamRes.data;
    if (!team) return null;
    const allSops = sopsRes.data ?? [];
    const categories: CategoryWithCount[] = (catsRes.data ?? []).map((c) => ({
      ...c,
      sopCount: allSops.filter((s) => s.category_id === c.id).length,
    }));
    const directSops = allSops.filter((s) => s.category_id === null);
    return { team, categories, directSops };
  });

export const getCategory = createServerFn({ method: "GET" })
  .inputValidator((input: { teamId: string; categoryId: string }) => input)
  .handler(async ({ data }): Promise<CategoryDetail | null> => {
    const db = publicClient();
    const [catRes, teamRes, sopsRes] = await Promise.all([
      db.from("categories").select("*").eq("id", data.categoryId).eq("team_id", data.teamId).maybeSingle(),
      db.from("teams").select("*").eq("id", data.teamId).maybeSingle(),
      db.from("sops").select("*").eq("category_id", data.categoryId).order("created_at", { ascending: true }),
    ]);
    fail(catRes.error);
    fail(teamRes.error);
    fail(sopsRes.error);
    const category = catRes.data;
    if (!category) return null;
    return { team: teamRes.data, category, sops: sopsRes.data ?? [] };
  });
