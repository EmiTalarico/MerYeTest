import { supabase } from "@/lib/supabase";

export interface Paciente {
  id?: string;
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
}

// GET PACIENTES
export async function getPacientes() {
  const { data, error } = await supabase.from("pacientes").select("*");
  if (error) throw error;
  return data as Paciente[];
}

// CREATE PACIENTE
export async function createPaciente(paciente: Paciente) {
  const { data: existente, error: errorCheck } = await supabase
    .from("pacientes")
    .select("*")
    .eq("dni", paciente.dni);

  if (errorCheck) throw errorCheck;

  if (existente && existente.length > 0) {
    throw new Error("Ya existe un paciente con ese DNI");
  }

  const { data, error } = await supabase
    .from("pacientes")
    .insert([paciente])
    .select()
    .single();

  if (error) throw error;
  return data as Paciente;
}

// UPDATE PACIENTE
export async function updatePaciente(id: string, paciente: Paciente) {
  const { data: existente, error: errorCheck } = await supabase
    .from("pacientes")
    .select("*")
    .eq("dni", paciente.dni);

  if (errorCheck) throw errorCheck;

  if (existente && existente.some((p) => p.id !== id)) {
    throw new Error("Ya existe otro paciente con ese DNI");
  }

  const { error } = await supabase
    .from("pacientes")
    .update(paciente)
    .eq("id", id);

  if (error) throw error;
}

// DELETE PACIENTE
export async function deletePaciente(id: string) {
  const { error } = await supabase
    .from("pacientes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}