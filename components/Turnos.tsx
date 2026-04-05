"use client";

import { useState, useEffect, Fragment } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, Transition, Combobox } from "@headlessui/react";

interface Paciente {
  id: string;
  nombre: string;
  apellido?: string;
  dni?: string;
}

interface Medico {
  id: string;
  nombre: string;
  apellido?: string;
  especialidad?: string;
}

interface Turno {
  id: string;
  paciente_id: string;
  paciente?: Paciente;
  medico: string;
  fecha: string; // ISO string
  estado: "pendiente" | "completado" | "cancelado";
}

export default function Turnos() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTurno, setEditTurno] = useState<Turno | null>(null);

  const [form, setForm] = useState({
    paciente_id: "",
    medico: "",
    fecha: "",
    hora: "",
    estado: "pendiente",
  });

  const [queryPaciente, setQueryPaciente] = useState("");
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  const [queryMedico, setQueryMedico] = useState("");
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);

  const filteredPacientes =
    queryPaciente === ""
      ? pacientes
      : pacientes.filter(
          (p) =>
            p.nombre.toLowerCase().includes(queryPaciente.toLowerCase()) ||
            p.dni?.includes(queryPaciente)
        );

  const filteredMedicos =
    queryMedico === ""
      ? medicos
      : medicos.filter(
          (m) =>
            m.nombre.toLowerCase().includes(queryMedico.toLowerCase()) ||
            (m.apellido && m.apellido.toLowerCase().includes(queryMedico.toLowerCase()))
        );

  async function cargarDatos() {
    const { data: pacientesData } = await supabase.from("pacientes").select("*");
    setPacientes(pacientesData || []);

    const { data: medicosData } = await supabase.from("medicos").select("*");
    setMedicos(medicosData || []);

    const { data: turnosData } = await supabase
      .from("turnos")
      .select(`*, paciente:paciente_id(*)`)
      .order("fecha", { ascending: true });
    setTurnos(turnosData || []);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function abrirModalNuevo() {
    setEditTurno(null);
    setForm({ paciente_id: "", medico: "", fecha: "", hora: "", estado: "pendiente" });
    setSelectedPaciente(null);
    setSelectedMedico(null);
    setQueryPaciente("");
    setQueryMedico("");
    setModalOpen(true);
  }

  function abrirModalEditar(t: Turno) {
    const fechaObj = new Date(t.fecha);
    const fechaStr = fechaObj.toISOString().split("T")[0];
    const horaStr = fechaObj.toTimeString().substring(0,5);

    setEditTurno(t);
    setForm({
      paciente_id: t.paciente_id,
      medico: t.medico,
      fecha: fechaStr,
      hora: horaStr,
      estado: t.estado,
    });

    const paciente = pacientes.find((p) => p.id === t.paciente_id) || null;
    setSelectedPaciente(paciente);
    setQueryPaciente(paciente ? paciente.nombre : "");

    const medicoSel = medicos.find((m) => `${m.nombre} ${m.apellido || ""}`.trim() === t.medico) || null;
    setSelectedMedico(medicoSel);
    setQueryMedico(medicoSel ? `${medicoSel.nombre} ${medicoSel.apellido || ""}`.trim() : "");

    setModalOpen(true);
  }

  function generarSlots() {
    if (!form.fecha) return [];
    const start = 8;
    const end = 20;
    const slots: {hora:string, ocupado:boolean}[] = [];
    for (let h = start; h < end; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = String(h).padStart(2,"0");
        const mm = String(m).padStart(2,"0");
        const horaStr = `${hh}:${mm}`;
        const fullDate = new Date(`${form.fecha}T${horaStr}:00`);
        const ocupado = turnos.some(t => t.medico === form.medico && new Date(t.fecha).getTime() === fullDate.getTime());
        slots.push({hora: horaStr, ocupado});
      }
    }
    return slots;
  }

  async function guardarTurno() {
    if (!form.medico || !form.fecha || !form.hora) return;

    let pacienteId = form.paciente_id;

    if (!pacienteId && queryPaciente.trim() !== "") {
      const nombreParts = queryPaciente.trim().split(" ");
      const nombre = nombreParts[0];
      const apellido = nombreParts.slice(1).join(" ") || "";
      
      const { data: nuevoPaciente, error } = await supabase
        .from("pacientes")
        .insert([{ nombre, apellido }])
        .select()
        .single();

      if (error) {
        alert("Error al crear paciente: " + error.message);
        return;
      }

      pacienteId = nuevoPaciente.id;
      setPacientes((prev) => [...prev, nuevoPaciente]);
      setSelectedPaciente(nuevoPaciente);
    }

    if (!pacienteId) {
      alert("Debe seleccionar o ingresar un paciente");
      return;
    }

    const fechaHoraISO = new Date(`${form.fecha}T${form.hora}:00`).toISOString();

    const formToSave = { paciente_id: pacienteId, medico: form.medico, fecha: fechaHoraISO, estado: form.estado };

    const { data: existente } = await supabase
      .from("turnos")
      .select("*")
      .eq("medico", form.medico)
      .eq("fecha", fechaHoraISO);

    if (existente && existente.length > 0 && !editTurno) {
      alert("Ya existe un turno para este médico en esa fecha y hora");
      return;
    }

    if (!editTurno) {
      await supabase.from("turnos").insert([formToSave]);
    } else {
      await supabase.from("turnos").update(formToSave).eq("id", editTurno.id);
    }

    setModalOpen(false);
    cargarDatos();
  }

  async function borrarTurno(id: string) {
    if (!confirm("¿Eliminar turno?")) return;
    await supabase.from("turnos").delete().eq("id", id);
    cargarDatos();
  }

  const hoy = new Date();
  const proximosTurnos = turnos.filter(t => new Date(t.fecha) >= hoy).slice(0, 5);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Turnos</h2>

      <div className="mb-4 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Próximos turnos</h3>
        {proximosTurnos.length === 0 ? (
          <div className="text-gray-500">No hay turnos próximos</div>
        ) : (
          <ul className="space-y-1">
            {proximosTurnos.map((t) => (
              <li key={t.id} className="flex justify-between">
                <span>{t.paciente?.nombre} ({t.medico})</span>
                <span>{new Date(t.fecha).toLocaleDateString("es-AR", {day: "2-digit", month: "2-digit", year: "numeric"})} {new Date(t.fecha).toLocaleTimeString("es-AR",{hour:'2-digit',minute:'2-digit'})}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={abrirModalNuevo} className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 mb-4">Nuevo Turno</button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {turnos.map((t) => (
          <div key={t.id} className="border rounded p-3 shadow flex justify-between items-start bg-white">
            <div>
              <div className="font-semibold">{t.paciente?.nombre} ({t.paciente?.dni})</div>
              <div className="text-sm text-gray-600">Médico: {t.medico}</div>
              <div className="text-sm text-gray-600">Fecha: {new Date(t.fecha).toLocaleString()}</div>
              <div className={`inline-block px-2 py-0.5 rounded text-white mt-1 ${t.estado==="pendiente"?"bg-yellow-400":t.estado==="completado"?"bg-green-500":"bg-red-500"}`}>{t.estado}</div>
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={() => abrirModalEditar(t)} className="bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500 text-white">Editar</button>
              <button onClick={() => borrarTurno(t.id)} className="bg-red-500 px-2 py-1 rounded hover:bg-red-600 text-white">Borrar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={()=>setModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    {editTurno ? "Editar Turno" : "Nuevo Turno"}
                  </Dialog.Title>

                  {/* Paciente */}
                  <Combobox value={selectedPaciente} onChange={(p)=>{setSelectedPaciente(p); setForm({...form,paciente_id:p?p.id:""});}}>
                    <div className="relative mb-2">
                      <Combobox.Input className="border rounded px-2 py-1 w-full" onChange={(e)=>setQueryPaciente(e.target.value)} displayValue={(p:Paciente)=>p?`${p.nombre} ${p.apellido} (${p.dni})`:""} placeholder="Buscar paciente..." />
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                          {filteredPacientes.length===0&&<div className="p-2 text-gray-500">No encontrado</div>}
                          {filteredPacientes.map(p=>(
                            <Combobox.Option key={p.id} value={p} className={({active})=>`cursor-pointer select-none px-2 py-1 ${active?"bg-blue-500 text-white":""}`}>{p.nombre} {p.apellido} ({p.dni})</Combobox.Option>
                          ))}
                        </Combobox.Options>
                      </Transition>
                    </div>
                  </Combobox>

                  {/* Médico */}
                  <Combobox value={selectedMedico} onChange={(m)=>{setSelectedMedico(m); setForm({...form,medico:m?`${m.nombre} ${m.apellido||""}`.trim():""});}}>
                    <div className="relative mb-2">
                      <Combobox.Input className="border rounded px-2 py-1 w-full" onChange={(e)=>setQueryMedico(e.target.value)} displayValue={(m:Medico)=>m?`${m.nombre} ${m.apellido||""}`:""} placeholder="Buscar médico..." />
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                          {filteredMedicos.length===0&&<div className="p-2 text-gray-500">No encontrado</div>}
                          {filteredMedicos.map(m=>(
                            <Combobox.Option key={m.id} value={m} className={({active})=>`cursor-pointer select-none px-2 py-1 ${active?"bg-blue-500 text-white":""}`}>{m.nombre} {m.apellido} {m.especialidad&&`(${m.especialidad})`}</Combobox.Option>
                          ))}
                        </Combobox.Options>
                      </Transition>
                    </div>
                  </Combobox>

                  {/* Fecha */}
                  <input type="date" value={form.fecha} onChange={(e)=>setForm({...form,fecha:e.target.value,hora:""})} className="border rounded px-2 py-1 w-full mb-2" />

                  {/* Hora */}
                  <select value={form.hora} onChange={(e)=>setForm({...form,hora:e.target.value})} className="border rounded px-2 py-1 w-full mb-2">
                    <option value="">Seleccionar hora</option>
                    {generarSlots().map(s=>(
                      <option 
                        key={s.hora} 
                        value={s.hora} 
                        disabled={s.ocupado && !(editTurno && `${new Date(editTurno.fecha).getHours()}:${String(new Date(editTurno.fecha).getMinutes()).padStart(2,"0")}`===s.hora)}
                        className={s.ocupado?"text-red-400":"text-black"}
                      >
                        {s.hora}{s.ocupado?" (ocupado)":""}
                      </option>
                    ))}
                  </select>

                  {/* Estado */}
                  <select value={form.estado} onChange={(e)=>setForm({...form,estado:e.target.value as any})} className="border rounded px-2 py-1 w-full mb-2">
                    <option value="pendiente">Pendiente</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>

                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={()=>setModalOpen(false)} className="bg-gray-300 px-4 py-1 rounded hover:bg-gray-400">Cancelar</button>
                    <button onClick={guardarTurno} className="bg-blue-500 px-4 py-1 rounded text-white hover:bg-blue-600">Guardar</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}