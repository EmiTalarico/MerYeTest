import { supabase } from "@/lib/supabase";

export async function getTurnos() {
  const { data, error } = await supabase
    .from("turnos")
    .select(`*, paciente:paciente_id(*)`)
    .order("fecha", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createTurno(turno: any) {
  const { data: existente } = await supabase
    .from("turnos")
    .select("*")
    .eq("medico", turno.medico)
    .eq("fecha", turno.fecha);

  if (existente && existente.length > 0) {
    throw new Error("Turno duplicado para ese médico");
  }

  const { error } = await supabase.from("turnos").insert([turno]);
  if (error) throw error;
}