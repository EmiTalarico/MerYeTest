"use client";

import { useState } from "react";
import Pacientes from "@/components/Pacientes";
import Turnos from "@/components/Turnos";
import Medicos from "@/components/Medicos";

const TABS = [
  { key: "turnos", label: "Turnos" },
  { key: "pacientes", label: "Pacientes" },
  { key: "medicos", label: "Médicos" },
  { key: "estadisticas", label: "Estadísticas" },
  { key: "finanzas", label: "Finanzas" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(TABS[0].key);

  return (
    <main className="p-4 md:p-10 bg-gray-50 min-h-screen">
      <div className="flex flex-wrap justify-center items-center gap-2 mb-6">
        <img src="/logo2.png" className="h-20 w-20 object-contain" />

        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t-lg font-semibold
              ${
                activeTab === tab.key
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-b-lg shadow min-h-[400px]">
        {activeTab === "turnos" && <Turnos />}
        {activeTab === "pacientes" && <Pacientes />}
        {activeTab === "medicos" && <Medicos />}
        {activeTab === "estadisticas" && <div>Próximamente</div>}
        {activeTab === "finanzas" && <div>Próximamente</div>}
      </div>
    </main>
  );
}