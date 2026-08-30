"use client";

import Image from "next/image";
import Link from "next/link";
import { User, BadgeCheck, ArrowRight } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { BrandWordmark } from "@/components/ui/brand-wordmark";

export function SignupSelectionScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 md:grid md:grid-cols-2 md:items-start">
      <section className="hidden h-screen bg-black md:sticky md:top-0 md:block">
        <div className="relative h-full w-full overflow-hidden">
          <Image
            src="/images/personas/persona3/persona3-selection-hero.webp"
            alt="Modelo Sigillus"
            fill
            priority
            quality={90}
            className="object-cover opacity-80 [object-position:center_30%]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-linear-to-br from-black/55 via-black/25 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-wine-900/35 via-transparent to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-end px-10 pb-14 text-white lg:px-14">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
              Junte-se à Elite
            </p>
            <h2 className="mt-4 max-w-lg font-display text-5xl leading-[0.95] text-white lg:text-6xl">
              Sua jornada começa aqui.
            </h2>
            <div className="mt-7 h-px w-24 bg-white/45" />
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
              Escolha como deseja participar da plataforma mais exclusiva do mercado.
            </p>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-svh min-h-screen flex-col justify-between px-4 pt-6 pb-8 sm:px-6 md:items-center md:justify-center md:px-10 md:py-10">
        <div className="absolute inset-0 overflow-hidden md:hidden">
          <Image
            src="/images/personas/persona3/persona3-selection-hero.webp"
            alt=""
            fill
            className="object-cover opacity-65"
            sizes="100vw"
            aria-hidden
          />
          <div className="absolute inset-0 bg-linear-to-b from-white/75 via-white/40 to-white/75" />
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-linear-to-t from-zinc-50 to-transparent pointer-events-none" />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-xs flex-col flex-1 justify-between md:max-w-xl md:flex-initial md:justify-start md:space-y-6">
          <div className="flex items-center gap-2">
            <BackButton />
            <BrandWordmark />
          </div>

          {/* Meio: título, descrição e cards */}
          <div className="my-auto flex flex-col space-y-6">
            <header className="text-center">
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:mt-3 md:text-4xl">
                Como você deseja participar?
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-zinc-600 md:mt-3">
                Selecione o caminho que melhor se adapta à sua experiência exclusiva dentro do
                ecossistema Sigillus.
              </p>
            </header>

            <div className="grid grid-cols-2 gap-3 md:gap-6">
              {/* Card Cliente */}
              <Link
                href="/auth/cadastro/cliente"
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-5 md:p-8 shadow-sm backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-wine-300 hover:shadow-xl hover:shadow-wine-900/10 min-h-[180px] md:min-h-0"
              >
                <div className="absolute -right-4 -top-4 p-6 opacity-0 transition-all duration-500 group-hover:-translate-y-2 group-hover:translate-x-2 group-hover:opacity-10">
                  <User className="h-32 w-32 text-wine-700" strokeWidth={1} />
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="mb-3 md:mb-8 flex h-10 w-10 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 transition-colors duration-500 group-hover:bg-wine-50 group-hover:text-wine-700">
                    <User className="size-5 md:size-7" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm md:text-xl font-bold text-zinc-900 transition-colors group-hover:text-wine-800">
                    <span className="md:hidden">Acessar a Plataforma</span>
                    <span className="hidden md:inline">Quero acessar a plataforma</span>
                  </h3>
                </div>
                <p className="hidden md:block mb-10 flex-grow text-sm leading-relaxed text-zinc-600">
                  Tenha acesso a perfis verificados e uma curadoria de elite com total discrição e
                  segurança. Explore um universo de possibilidades.
                </p>
                <div className="mt-auto flex items-center justify-start text-[10px] font-black uppercase tracking-widest text-wine-700">
                  <span className="whitespace-nowrap hidden md:inline">Iniciar Experiência</span>
                  <span className="whitespace-nowrap md:hidden">Iniciar</span>
                  <ArrowRight className="ml-2 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              {/* Card Profissional */}
              <Link
                href="/auth/cadastro/profissional"
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-5 md:p-8 shadow-sm backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-wine-300 hover:shadow-xl hover:shadow-wine-900/10 min-h-[180px] md:min-h-0"
              >
                <div className="absolute -right-4 -top-4 p-6 opacity-0 transition-all duration-500 group-hover:-translate-y-2 group-hover:translate-x-2 group-hover:opacity-10">
                  <BadgeCheck className="h-32 w-32 text-wine-700" strokeWidth={1} />
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="mb-3 md:mb-8 flex h-10 w-10 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 transition-colors duration-500 group-hover:bg-wine-50 group-hover:text-wine-700">
                    <BadgeCheck className="size-5 md:size-7" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm md:text-xl font-bold text-zinc-900 transition-colors group-hover:text-wine-800">
                    <span className="md:hidden">Anunciar meu Perfil</span>
                    <span className="hidden md:inline">Quero anunciar meu perfil</span>
                  </h3>
                </div>
                <p className="hidden md:block mb-10 flex-grow text-sm leading-relaxed text-zinc-600">
                  Apresente seu perfil na plataforma mais exclusiva do mercado e tenha controle
                  total da sua independência e audiência.
                </p>
                <div className="mt-auto flex items-center justify-start text-[9px] md:text-[10px] font-black uppercase tracking-widest text-wine-700">
                  <span className="whitespace-nowrap">Candidatar-se</span>
                  <ArrowRight className="ml-2 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </div>

          {/* Rodapé: Fazer login */}
          <div className="pt-4 text-center text-sm font-medium text-zinc-600 md:mt-12 md:pt-6">
            <p>
              Já possui uma conta?{" "}
              <Link href="/auth/login" className="ml-1 font-bold text-wine-700 hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
