"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useAdminSession } from "@/lib/admin-session";
import { getMockAdminByEmail } from "@/lib/mock-users";

export function AdminLoginScreen() {
  const router = useRouter();
  const { login } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600)); // simula latência

    const admin = getMockAdminByEmail(email.trim());
    if (!admin || admin.password !== password) {
      setError("Credenciais inválidas. Verifique o e-mail e senha.");
      setLoading(false);
      return;
    }

    login(admin);
    router.push("/admin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      {/* Fundo com padrão sutil */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #7f1d1d22 0%, transparent 50%), radial-gradient(circle at 80% 20%, #3f3f4622 0%, transparent 50%)",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Badge de acesso restrito */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-red-900/60 bg-red-950/40 px-4 py-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">
              Acesso Restrito
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/60 backdrop-blur-sm">
          {/* Logo */}
          <div className="mb-8 text-center">
            <p className="font-display text-3xl font-bold text-zinc-100">
              Sigillus
              <span className="ml-2 rounded-md bg-wine-800/60 px-2 py-0.5 font-sans text-xs font-semibold uppercase tracking-widest text-wine-300">
                Admin
              </span>
            </p>
            <p className="mt-2 text-sm text-zinc-500">Painel de Gestão Administrativa</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="text-xs font-semibold uppercase tracking-widest text-zinc-400"
              >
                E-mail administrativo
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sigillus.dev"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all focus:border-wine-600 focus:ring-1 focus:ring-wine-600/30"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="text-xs font-semibold uppercase tracking-widest text-zinc-400"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 pr-11 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all focus:border-wine-600 focus:ring-1 focus:ring-wine-600/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error ? (
              <p className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-2.5 text-sm text-red-400">
                {error}
              </p>
            ) : null}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-wine-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-wine-900/40 transition-all hover:bg-wine-600 hover:shadow-wine-700/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Autenticando…
                </>
              ) : (
                "Acessar painel"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-600">
            Este painel é de uso exclusivo da equipe Sigillus.
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-700">
          Sigillus Admin · Ambiente seguro e monitorado
        </p>
      </div>
    </div>
  );
}
