"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, User, Briefcase, Clock, CheckCircle2, AlertCircle, Pencil } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/GlassCard";

type ClinicSettings = {
  id: string;
  doctors: string[];
  services: string[];
  daily_start: string;
  daily_end: string;
  slot_duration: number;
};

export default function SettingsClient() {
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Addition states
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState("");
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);

  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState("");
  const [isSavingService, setIsSavingService] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const result = await res.json();
      if (result.success) {
        if (result.data) {
          setSettings(result.data);
        } else {
          // Initialize empty defaults if no settings exist in DB yet
          setSettings({
            id: "",
            doctors: [],
            services: [],
            daily_start: "08:00",
            daily_end: "18:00",
            slot_duration: 15
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setToast({ message: "Failed to load settings", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await res.json();
      if (result.success) {
        setToast({ message: "Settings saved successfully!", type: "success" });
        setSettings(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setToast({ message: error.message || "Failed to save settings", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = async (type: "doctors" | "services", value: string) => {
    if (!value.trim() || !settings) return;
    
    const trimmed = value.trim();
    if (settings[type].includes(trimmed)) {
      setToast({ message: `${trimmed} already exists`, type: "error" });
      return;
    }

    const setSaving = type === "doctors" ? setIsSavingDoctor : setIsSavingService;
    const setAdding = type === "doctors" ? setIsAddingDoctor : setIsAddingService;
    const setValue = type === "doctors" ? setNewDoctor : setNewService;

    setSaving(true);
    try {
      const updatedList = [...settings[type], trimmed];
      const updatedSettings = { ...settings, [type]: updatedList };
      
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });
      
      const result = await res.json();
      if (result.success) {
        setSettings(result.data);
        setValue("");
        setAdding(false);
        setToast({ 
          message: `${type === "doctors" ? "Doctor" : "Service"} added successfully`, 
          type: "success" 
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setToast({ 
        message: error.message || `Failed to save ${type === "doctors" ? "doctor" : "service"}`, 
        type: "error" 
      });
    } finally {
      setSaving(false);
    }
  };

  const removeItem = (type: "doctors" | "services", index: number) => {
    if (!settings) return;
    const newList = [...settings[type]];
    newList.splice(index, 1);
    setSettings({
      ...settings,
      [type]: newList,
    });
  };

  const editItem = (type: "doctors" | "services", index: number, newValue: string) => {
    if (!settings || !newValue.trim()) return;
    const newList = [...settings[type]];
    newList[index] = newValue.trim();
    setSettings({
      ...settings,
      [type]: newList,
    });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-slate-400 animate-pulse font-medium">Loading clinic settings...</div>
      </div>
    );
  }

  if (!settings && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900">Connection Issue</h3>
          <p className="text-sm text-slate-500">We couldn't reach the settings service.</p>
        </div>
        <button 
          onClick={fetchSettings}
          className="px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Safety check for TS
  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinic Settings</h1>
          <p className="text-sm text-slate-500">Configure clinic hours and staff.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95",
            isSaving && "opacity-60 cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Doctors Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 px-1">
            <User className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Doctors</h2>
          </div>
          <GlassCard className="p-4 flex flex-col min-h-[300px]">
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout" initial={false}>
                {settings.doctors.map((doc, idx) => (
                  <motion.div
                    key={doc}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/30 border border-white/50 group hover:border-blue-200/50 transition-colors"
                  >
                    <input
                      value={doc}
                      onChange={(e) => editItem("doctors", idx, e.target.value)}
                      className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none"
                    />
                    <button
                      onClick={() => removeItem("doctors", idx)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20">
              <AnimatePresence mode="wait">
                {isAddingDoctor ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-3"
                  >
                    <input
                      autoFocus
                      type="text"
                      placeholder="Enter doctor name"
                      value={newDoctor}
                      onChange={(e) => setNewDoctor(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addItem("doctors", newDoctor)}
                      className="w-full bg-white/60 border border-blue-200/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => addItem("doctors", newDoctor)}
                        disabled={isSavingDoctor}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                      >
                        {isSavingDoctor ? (
                          <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : "Add"}
                      </button>
                      <button
                        onClick={() => setIsAddingDoctor(false)}
                        className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setIsAddingDoctor(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-sm font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    Add Doctor
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>

        {/* Services Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 px-1">
            <Briefcase className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Services</h2>
          </div>
          <GlassCard className="p-4 flex flex-col min-h-[300px]">
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout" initial={false}>
                {settings.services.map((svc, idx) => (
                  <motion.div
                    key={svc}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/30 border border-white/50 group hover:border-emerald-200/50 transition-colors"
                  >
                    <input
                      value={svc}
                      onChange={(e) => editItem("services", idx, e.target.value)}
                      className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none"
                    />
                    <button
                      onClick={() => removeItem("services", idx)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20">
              <AnimatePresence mode="wait">
                {isAddingService ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-3"
                  >
                    <input
                      autoFocus
                      type="text"
                      placeholder="Enter service name"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addItem("services", newService)}
                      className="w-full bg-white/60 border border-emerald-200/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => addItem("services", newService)}
                        disabled={isSavingService}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                      >
                        {isSavingService ? (
                          <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : "Add"}
                      </button>
                      <button
                        onClick={() => setIsAddingService(false)}
                        className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setIsAddingService(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-sm font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    Add Service
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>

        {/* Clinic Hours Section */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 px-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Clinic Hours</h2>
          </div>
          <GlassCard className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Daily Start Time</label>
                <input
                  type="time"
                  value={settings.daily_start}
                  onChange={(e) => settings && setSettings({ ...settings, daily_start: e.target.value })}
                  className="mt-2 w-full bg-white/40 border border-white/50 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Daily End Time</label>
                <input
                  type="time"
                  value={settings.daily_end}
                  onChange={(e) => settings && setSettings({ ...settings, daily_end: e.target.value })}
                  className="mt-2 w-full bg-white/40 border border-white/50 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Slot Duration (min)</label>
                <select
                  value={settings.slot_duration}
                  onChange={(e) => settings && setSettings({ ...settings, slot_duration: parseInt(e.target.value, 10) })}
                  className="mt-2 w-full bg-white/40 border border-white/50 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Mini Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-full shadow-2xl border flex items-center gap-2 text-sm font-semibold whitespace-nowrap",
              toast.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : "bg-red-50 border-red-200 text-red-800"
            )}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
