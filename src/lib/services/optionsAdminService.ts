import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";

export type OptionRow = Database["public"]["Tables"]["options"]["Row"];
export type OptionInsert = Database["public"]["Tables"]["options"]["Insert"];
export type OptionUpdate = Database["public"]["Tables"]["options"]["Update"];

export async function listOptions(): Promise<OptionRow[]> {
  const { data, error } = await supabase
    .from("options")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createOption(payload: OptionInsert): Promise<OptionRow> {
  const { data, error } = await supabase
    .from("options")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateOption(
  id: string,
  updates: OptionUpdate,
): Promise<OptionRow> {
  const { data, error } = await supabase
    .from("options")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteOption(id: string): Promise<void> {
  const { error } = await supabase.from("options").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
