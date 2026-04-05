import { supabase } from @libsupabase;

export async function getPacientes() {
  const { data, error } = await supabase.from(pacientes).select();
  if (error) throw error;
  return data;
}

export async function createPaciente(paciente any) {
  const { data existente } = await supabase
    .from(pacientes)
    .select()
    .eq(dni, paciente.dni);

  if (existente && existente.length  0) {
    throw new Error(Ya existe un paciente con ese DNI);
  }

  const { data, error } = await supabase
    .from(pacientes)
    .insert([paciente])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePaciente(id: string, paciente: any) {
  // Validar DNI duplicado (excluyendo el mismo paciente)
  const { data: existente } = await supabase
    .from("pacientes")
    .select("*")
    .eq("dni", paciente.dni);

  if (existente && existente.some((p) => p.id !== id)) {
    throw new Error("Ya existe otro paciente con ese DNI");
  }

  const { error } = await supabase
    .from("pacientes")
    .update(paciente)
    .eq("id", id);

  if (error) throw error;
}

export async function deletePaciente(id string) {
  const { error } = await supabase
    .from(pacientes)
    .delete()
    .eq(id, id);

  if (error) throw error;
}