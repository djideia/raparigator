"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { AuthHeroMobile } from "@/components/ui/auth-hero-mobile";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { readRedirectTarget } from "../../lib/auth-return";
import { useAuthSession } from "../../lib/auth-session";
import { mockUsers } from "../../lib/mock-users";

const loginHeroImage = {
  src: "/images/personas/persona2/persona2-elegant-look.webp",
  heroPosition: "center",
};

export function LoginScreen() {
  const router = useRouter();
  const { setRole } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const user = mockUsers.find(
      (item) => item.email === email.trim() && item.password === password,
    );

    if (!user) {
      setError("Credenciais inválidas. Verifique seu e-mail e senha.");
      return;
    }

    setRole(user.role);
    router.push(readRedirectTarget());
  };

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 md:grid md:h-auto md:min-h-screen md:grid-cols-2 md:items-start">
      <section className="flex min-h-0 flex-1 flex-col md:min-h-screen">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:px-6 md:flex md:items-center md:justify-center md:overflow-y-auto md:px-12 md:py-10">
          <AuthHeroMobile images={[loginHeroImage]} eyebrow="Plataforma exclusiva" unoptimized />

          <div className="mx-auto mt-5 w-full max-w-md space-y-5 md:mt-0 md:space-y-8">
            <header>
              <div className="mb-6 hidden items-center gap-2 md:flex">
                <BackButton />
                <BrandWordmark />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-wine-200" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-wine-700">
                  Acesso Seguro
                </span>
                <div className="h-px flex-1 bg-wine-200" />
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:mt-4 sm:text-3xl">
                Bem-vindo de volta
              </h1>
            </header>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="currentColor"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.34-.85 3.73-.78 1.78.11 3.26.85 4.13 2.14-3.32 1.96-2.75 6.42.42 7.75-.82 1.95-1.89 3.95-3.36 5.06zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.38-2.02 4.45-3.74 4.25z" />
                  </svg>
                  Apple
                </button>
              </div>

              <div className="relative flex items-center">
                <div className="grow border-t border-zinc-200" />
                <span className="shrink-0 px-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                  ou com e-mail
                </span>
                <div className="grow border-t border-zinc-200" />
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                id="email"
                label="E-mail"
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                premium
                leadingIcon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                }
              />

              <div className="space-y-1">
                <Input
                  id="password"
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setPassword(event.target.value)
                  }
                  premium
                  leadingIcon={
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                  }
                />
                <div className="flex justify-end pt-1">
                  <Link
                    href="/auth/recuperar-senha"
                    className="text-xs font-semibold text-wine-700 transition-all hover:text-wine-800 hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="sticky bottom-0 z-20 pt-1 pb-1 md:static md:p-0">
                <Button fullWidth size="lg" className="shadow-md shadow-wine-700/20">
                  Entrar na plataforma
                </Button>
              </div>

              <div className="space-y-3 border-t border-zinc-100 pt-5 text-center text-sm text-zinc-600 md:pt-6">
                <p>
                  Ainda não tem conta?{" "}
                  <Link href="/auth/cadastro" className="font-bold text-wine-700 hover:underline">
                    Criar conta grátis
                  </Link>
                </p>
                <p className="border-t border-dashed border-zinc-200 pt-3">
                  Você é profissional?{" "}
                  <Link
                    href="/auth/cadastro/profissional"
                    className="font-bold text-wine-700 hover:underline"
                  >
                    Anuncie seu perfil aqui
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="hidden h-screen bg-black md:sticky md:top-0 md:block">
        <div className="relative h-full w-full overflow-hidden">
          <Image
            src={loginHeroImage.src}
            alt="Sigillus — plataforma exclusiva"
            fill
            priority
            quality={90}
            unoptimized
            className="object-cover object-center opacity-85"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-linear-to-l from-black/20 via-black/40 to-black/70" />
          <div className="absolute inset-0 bg-linear-to-t from-wine-900/40 via-transparent to-transparent" />

          <div className="relative z-10 flex h-full flex-col justify-end px-10 pb-14 text-white lg:px-14">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
              Plataforma exclusiva
            </p>
            <h2 className="mt-4 max-w-sm font-display text-4xl leading-tight text-white lg:text-5xl">
              Cada acesso, uma experiência única.
            </h2>
            <div className="mt-6 h-px w-16 bg-wine-400/60" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              Privacidade, segurança e exclusividade em cada interação dentro do ecossistema
              Sigillus.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
