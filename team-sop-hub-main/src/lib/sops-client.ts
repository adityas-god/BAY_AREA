import { supabase } from "@/integrations/supabase/client";

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// Teams
export async function createTeam(input: { name: string; description: string | null }) {
  const { data, error } = await supabase.from("teams").insert(input).select().single();
  fail(error);
  return data!;
}

export async function updateTeam(input: { id: string; name: string; description: string | null }) {
  const { data, error } = await supabase
    .from("teams")
    .update({ name: input.name, description: input.description })
    .eq("id", input.id)
    .select()
    .single();
  fail(error);
  return data!;
}

export async function deleteTeam(id: string) {
  const { error } = await supabase.from("teams").delete().eq("id", id);
  fail(error);
}

// Categories
export async function createCategory(input: { team_id: string; name: string }) {
  const { data, error } = await supabase.from("categories").insert(input).select().single();
  fail(error);
  return data!;
}

export async function updateCategory(input: { id: string; name: string }) {
  const { data, error } = await supabase
    .from("categories")
    .update({ name: input.name })
    .eq("id", input.id)
    .select()
    .single();
  fail(error);
  return data!;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  fail(error);
}

// SOPs
export type SopWrite = {
  team_id: string;
  category_id: string | null;
  title: string;
  kind: "link" | "note";
  url: string | null;
  content: string | null;
};

export async function createSop(input: SopWrite) {
  const { data, error } = await supabase.from("sops").insert(input).select().single();
  fail(error);
  return data!;
}

export async function updateSop(input: {
  id: string;
  title: string;
  kind: "link" | "note";
  url: string | null;
  content: string | null;
}) {
  const { data, error } = await supabase
    .from("sops")
    .update({ title: input.title, kind: input.kind, url: input.url, content: input.content })
    .eq("id", input.id)
    .select()
    .single();
  fail(error);
  return data!;
}

export async function deleteSop(id: string) {
  const { error } = await supabase.from("sops").delete().eq("id", id);
  fail(error);
}
