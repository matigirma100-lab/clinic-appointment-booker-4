"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Users, MoreHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PatientModal, type Patient } from "@/components/PatientModal";
import { GlassCard } from "@/components/GlassCard";

export default function PatientsClient() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/patients");
      const result = await res.json();
      if (result.success) {
        setPatients(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this patient record?")) return;

    try {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setPatients((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete patient:", error);
    }
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500">Manage and search patient records.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          New Patient
        </button>
      </div>

      <GlassCard className="p-1">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/20">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Phone</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Age</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Gender</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Notes</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      Loading patients...
                    </td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p) => (
                    <motion.tr
                      key={p.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-white/10 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{p.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 font-medium">{p.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{p.age ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{p.gender ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-500 line-clamp-1 max-w-[200px]">
                          {p.notes ?? "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 rounded-lg hover:bg-white/20 text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </GlassCard>

      <PatientModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patient={editingPatient}
        onSuccess={fetchPatients}
      />
    </div>
  );
}
