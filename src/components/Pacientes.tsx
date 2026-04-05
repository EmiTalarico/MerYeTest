"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, Transition } from "@headlessui/react";

interface Paciente {
  id: string;
  nombre: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  nacimiento?: string;
  observaciones?: string;
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editPaciente, setEditPaciente] = useState<Paciente | null>(null);
  const [form, setForm] = useState<Omit<Paciente, "id">>({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    nacimiento: "",
    observaciones: "",
  });

  // Cargar pacientes
  const cargarPacientes = useCallback(async () => {
    const { data } = await supabase.from("pacientes").select("*");
    setPacientes(data || []);
  }, []);

  useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  // Filtrado memoizado
  const filtered = useMemo(() => {
    if (!search) return pacientes;
    return pacientes.filter(
      (p) =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.dni?.includes(search)
    );
  }, [search, pacientes]);

  // Abrir modal
  const abrirModal = useCallback((paciente?: Paciente) => {
    if (paciente) {
      setEditPaciente(paciente);
      setForm({
        nombre: paciente.nombre,
        apellido: paciente.apellido || "",
        dni: paciente.dni || "",
        telefono: paciente.telefono || "",
        nacimiento: paciente.nacimiento || "",
        observaciones: paciente.observaciones || "",
      });
    } else {
      setEditPaciente(null);
      setForm({
        nombre: "",
        apellido: "",
        dni: "",
        telefono: "",
        nacimiento: "",
        observaciones: "",
      });
    }
    setModalOpen(true);
  }, []);

  // Manejo de input genérico
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // Guardar paciente
  const guardarPaciente = useCallback(async () => {
    if (!form.nombre || !form.dni) {
      alert("Nombre y DNI son obligatorios");
      return;
    }

    try {
      if (!editPaciente) {
        // Verificar duplicado
        const { data: existente } = await supabase
          .from("pacientes")
          .select("*")
          .eq("dni", form.dni);

        if (existente && existente.length > 0) {
          alert("Ya existe un paciente con este DNI");
          return;
        }

        await supabase.from("pacientes").insert([form]);
      } else {
        const { data: duplicado } = await supabase
          .from("pacientes")
          .select("*")
          .eq("dni", form.dni)
          .neq("id", editPaciente.id);

        if (duplicado && duplicado.length > 0) {
          alert("Ya existe otro paciente con este DNI");
          return;
        }

        await supabase.from("pacientes").update(form).eq("id", editPaciente.id);
      }

      setModalOpen(false);
      cargarPacientes();
    } catch (err: any) {
      alert("Error al guardar paciente: " + err.message);
    }
  }, [form, editPaciente, cargarPacientes]);

  // Borrar paciente
  const borrarPaciente = useCallback(
    async (id: string) => {
      if (!confirm("¿Eliminar paciente?")) return;
      await supabase.from("pacientes").delete().eq("id", id);
      cargarPacientes();
    },
    [cargarPacientes]
  );

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Pacientes</h2>

      {/* Buscador y botón nuevo */}
      <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Buscar por nombre o DNI"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
        />
        <button
          onClick={() => abrirModal()}
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          Nuevo Paciente
        </button>
      </div>

      {/* Lista de pacientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="border rounded p-3 shadow flex justify-between items-start bg-white"
          >
            <div>
              <div className="font-semibold">{p.nombre} {p.apellido}</div>
              <div className="text-sm text-gray-600">DNI: {p.dni || "-"}</div>
              {p.telefono && <div className="text-sm text-gray-600">Tel: {p.telefono}</div>}
              {p.nacimiento && <div className="text-sm text-gray-600">Nacimiento: {p.nacimiento}</div>}
              {p.observaciones && <div className="text-sm italic">{p.observaciones}</div>}
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => abrirModal(p)}
                className="bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500 text-white"
              >
                Editar
              </button>
              <button
                onClick={() => borrarPaciente(p.id)}
                className="bg-red-500 px-2 py-1 rounded hover:bg-red-600 text-white"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    {editPaciente ? "Editar Paciente" : "Nuevo Paciente"}
                  </Dialog.Title>

                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                    <input
                      type="text"
                      name="apellido"
                      placeholder="Apellido"
                      value={form.apellido}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                    <input
                      type="text"
                      name="dni"
                      placeholder="DNI"
                      value={form.dni}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                    <input
                      type="text"
                      name="telefono"
                      placeholder="Teléfono"
                      value={form.telefono}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                    <input
                      type="date"
                      name="nacimiento"
                      placeholder="Nacimiento"
                      value={form.nacimiento}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                    <textarea
                      name="observaciones"
                      placeholder="Observaciones"
                      value={form.observaciones}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setModalOpen(false)}
                      className="bg-gray-300 px-4 py-1 rounded hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={guardarPaciente}
                      className="bg-blue-500 px-4 py-1 rounded text-white hover:bg-blue-600"
                    >
                      Guardar
                    </button>
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