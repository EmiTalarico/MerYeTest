"use client";

import { useState, useEffect, Fragment } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, Transition } from "@headlessui/react";

interface Medico {
  id: string;
  nombre: string;
  apellido?: string;
  especialidad?: string;
}

export default function Medicos() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMedico, setEditMedico] = useState<Medico | null>(null);
  const [form, setForm] = useState({ nombre: "", apellido: "", especialidad: "" });

  async function cargarMedicos() {
    const { data } = await supabase.from("medicos").select("*");
    setMedicos(data || []);
  }

  useEffect(() => {
    cargarMedicos();
  }, []);

  function abrirModalNuevo() {
    setEditMedico(null);
    setForm({ nombre: "", apellido: "", especialidad: "" });
    setModalOpen(true);
  }

  function abrirModalEditar(m: Medico) {
    setEditMedico(m);
    setForm({ nombre: m.nombre, apellido: m.apellido || "", especialidad: m.especialidad || "" });
    setModalOpen(true);
  }

  async function guardarMedico() {
    if (!form.nombre) return;

    if (!editMedico) {
      await supabase.from("medicos").insert([form]);
    } else {
      await supabase.from("medicos").update(form).eq("id", editMedico.id);
    }

    setModalOpen(false);
    cargarMedicos();
  }

  async function borrarMedico(id: string) {
    if (!confirm("¿Eliminar médico?")) return;
    await supabase.from("medicos").delete().eq("id", id);
    cargarMedicos();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Médicos</h2>

      <button
        onClick={abrirModalNuevo}
        className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 mb-4"
      >
        Nuevo Médico
      </button>

      <ul className="space-y-2">
        {medicos.map((m) => (
          <li key={m.id} className="flex justify-between items-center border p-2 rounded">
            <div>
              {m.nombre} {m.apellido} {m.especialidad && `(${m.especialidad})`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => abrirModalEditar(m)}
                className="bg-yellow-400 px-2 py-0.5 rounded text-white hover:bg-yellow-500"
              >
                Editar
              </button>
              <button
                onClick={() => borrarMedico(m.id)}
                className="bg-red-500 px-2 py-0.5 rounded text-white hover:bg-red-600"
              >
                Borrar
              </button>
            </div>
          </li>
        ))}
      </ul>

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
                    {editMedico ? "Editar Médico" : "Nuevo Médico"}
                  </Dialog.Title>

                  <input
                    type="text"
                    placeholder="Nombre"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="border rounded px-2 py-1 w-full mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Apellido"
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    className="border rounded px-2 py-1 w-full mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Especialidad"
                    value={form.especialidad}
                    onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
                    className="border rounded px-2 py-1 w-full mb-2"
                  />

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setModalOpen(false)}
                      className="bg-gray-300 px-4 py-1 rounded hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={guardarMedico}
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