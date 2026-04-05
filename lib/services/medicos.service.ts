import { supabase } from "@/lib/supabase";

export async function getMedicos() {
  const { data, error } = await supabase.from("medicos").select("*");
  if (error) throw error;
  return data;
}