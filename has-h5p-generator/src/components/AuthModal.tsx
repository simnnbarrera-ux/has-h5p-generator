"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  KeyRound,
  LogIn,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { supabasePublic, HasProfile } from "@/lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: HasProfile) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleQuickLogin = async (
    targetEmail: string,
    targetName: string,
    role: "professor" | "admin"
  ) => {
    setLoading(true);
    setErrorMsg(null);
    setEmail(targetEmail);
    setPassword("UAO2026!EQ36");
    try {
      await supabasePublic.auth.signInWithPassword({
        email: targetEmail,
        password: "UAO2026!EQ36",
      });
      const res = await fetch(`/api/projects?email=${encodeURIComponent(targetEmail)}`);
      const data = await res.json();
      const profile: HasProfile = data.profile || {
        email: targetEmail,
        full_name: targetName,
        faculty: "Facultad de Ingeniería y Ciencias Básicas",
        program: role === "admin" ? "Equipo 36 (EQ-36)" : "Campus Digital UAO",
        role,
        daily_quota: role === "admin" ? 100 : 50,
        preferred_voice:
          targetEmail.includes("oswaldo") || targetEmail.includes("alex")
            ? "es-CO-GonzaloNeural"
            : "es-CO-SalomeNeural",
      };
      onAuthSuccess(profile);
      onClose();
    } catch (err: any) {
      setErrorMsg("Error accediendo con perfil rápido demo: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === "login") {
        const { data, error } = await supabasePublic.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          // If auth fails in demo mode, try linking profile via api/projects
          if (
            error.message.includes("Invalid login credentials") ||
            error.message.includes("Email not confirmed")
          ) {
            const res = await fetch(
              `/api/projects?email=${encodeURIComponent(email.trim().toLowerCase())}`
            );
            const json = await res.json();
            if (json.profile) {
              onAuthSuccess(json.profile);
              onClose();
              return;
            }
          }
          throw error;
        }

        const user = data.user;
        const res = await fetch(
          `/api/projects?email=${encodeURIComponent(user?.email || email)}`
        );
        const json = await res.json();
        onAuthSuccess(
          json.profile || {
            email: user?.email || email,
            full_name: user?.user_metadata?.full_name || email.split("@")[0],
            faculty: "Facultad de Ingeniería y Ciencias Básicas",
            program: "Campus Digital UAO",
            role: "professor",
            daily_quota: 50,
            preferred_voice: "es-CO-SalomeNeural",
          }
        );
        onClose();
      } else {
        const { data, error } = await supabasePublic.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { full_name: fullName.trim() || email.split("@")[0] },
          },
        });

        if (error) throw error;

        setSuccessMsg(
          "Cuenta creada exitosamente en Supabase. Iniciando sesión..."
        );
        setTimeout(async () => {
          const res = await fetch(
            `/api/projects?email=${encodeURIComponent(email.trim().toLowerCase())}`
          );
          const json = await res.json();
          onAuthSuccess(
            json.profile || {
              email: email.trim().toLowerCase(),
              full_name: fullName.trim() || email.split("@")[0],
              faculty: "Facultad de Ingeniería y Ciencias Básicas",
              program: "Campus Digital UAO",
              role: "professor",
              daily_quota: 50,
              preferred_voice: "es-CO-SalomeNeural",
            }
          );
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocurrió un error al procesar tu solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[88vh] flex flex-col my-auto rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="p-3.5 sm:p-4 bg-[#8A1428] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200">
                  Campus Virtual UAO · EQ-36
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold leading-tight">
                {mode === "login" ? "Iniciar Sesión Docente" : "Registrar Cuenta"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-3">
          {/* Quick Access Demo Accounts - Compact 2-column Grid */}
          <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0099E6]" />
                <span>Acceso rápido con 1 clic a cuentas demo:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                UAO2026!EQ36
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {/* 1. Simón */}
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickLogin(
                    "simon.barrera@uao.edu.co",
                    "Simón Barrera Ruíz",
                    "admin"
                  )
                }
                className="flex items-center justify-between px-2.5 py-1.5 bg-white hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 rounded-lg text-left text-xs font-semibold text-slate-800 transition group disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">Simón</span>
                  <span className="text-[9px] font-bold text-[#8A1428] bg-rose-100 px-1.5 py-0.5 rounded shrink-0">
                    EQ-36
                  </span>
                </div>
                <LogIn className="w-3 h-3 text-slate-400 group-hover:text-[#8A1428] shrink-0" />
              </button>

              {/* 2. Hermaioni */}
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickLogin(
                    "hermaioni.delgado@uao.edu.co",
                    "Hermaioni Delgado Paz",
                    "admin"
                  )
                }
                className="flex items-center justify-between px-2.5 py-1.5 bg-white hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 rounded-lg text-left text-xs font-semibold text-slate-800 transition group disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">Hermaioni</span>
                  <span className="text-[9px] font-bold text-[#8A1428] bg-rose-100 px-1.5 py-0.5 rounded shrink-0">
                    EQ-36
                  </span>
                </div>
                <LogIn className="w-3 h-3 text-slate-400 group-hover:text-[#8A1428] shrink-0" />
              </button>

              {/* 3. Alex */}
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickLogin(
                    "alex.silva@uao.edu.co",
                    "Alex Yohan Silva Mina",
                    "admin"
                  )
                }
                className="flex items-center justify-between px-2.5 py-1.5 bg-white hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 rounded-lg text-left text-xs font-semibold text-slate-800 transition group disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">Alex</span>
                  <span className="text-[9px] font-bold text-[#8A1428] bg-rose-100 px-1.5 py-0.5 rounded shrink-0">
                    EQ-36
                  </span>
                </div>
                <LogIn className="w-3 h-3 text-slate-400 group-hover:text-[#8A1428] shrink-0" />
              </button>

              {/* 4. Demo Docente */}
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickLogin(
                    "demo.docente@uao.edu.co",
                    "Docente Invitado Demo",
                    "professor"
                  )
                }
                className="flex items-center justify-between px-2.5 py-1.5 bg-white hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 rounded-lg text-left text-xs font-semibold text-slate-800 transition group disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">Demo Docente</span>
                </div>
                <LogIn className="w-3 h-3 text-slate-400 group-hover:text-[#0099E6] shrink-0" />
              </button>

              {/* 5. Prof. Oswaldo (Reto 11) - Spans 2 columns */}
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickLogin(
                    "oswaldo.rodriguez@uao.edu.co",
                    "Prof. Oswaldo Rodríguez Díaz",
                    "professor"
                  )
                }
                className="col-span-2 flex items-center justify-between px-2.5 py-1.5 bg-white hover:bg-rose-50/60 border border-slate-200 hover:border-[#8A1428]/40 rounded-lg text-left text-xs font-semibold text-slate-800 transition group disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <GraduationCap className="w-3.5 h-3.5 text-[#8A1428] shrink-0" />
                  <span className="truncate">Prof. Oswaldo Rodríguez (Reto 11)</span>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-[#8A1428] font-semibold shrink-0">
                  Entrar →
                </span>
              </button>
            </div>
          </div>

          {/* Compact Divider */}
          <div className="relative my-2 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              O con credenciales
            </span>
          </div>

          {/* Error / Success Feedback */}
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="truncate">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="truncate">{successMsg}</span>
            </div>
          )}

          {/* Compact Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {mode === "register" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Dra. María Camargo"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8A1428]/30 focus:border-[#8A1428]"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="docente@uao.edu.co o personal"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8A1428]/30 focus:border-[#8A1428]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8A1428]/30 focus:border-[#8A1428]"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-2.5 px-4 bg-[#8A1428] hover:bg-[#6F1020] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : mode === "login" ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Crear Cuenta en Supabase</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-[11px] text-[#8A1428] font-semibold hover:underline"
            >
              {mode === "login"
                ? "¿No tienes cuenta? Regístrate aquí para la demo"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
