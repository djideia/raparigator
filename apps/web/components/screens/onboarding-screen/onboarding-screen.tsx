"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
// Importamos o novo locationsData em vez de cities e states separados
import { categories, locationsData } from "@/lib/mock-data";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { useAuthSession } from "@/lib/auth-session";
import { AccountMenu } from "@/components/layout/account-menu";
import { PopularLinksSection } from "../popular-links-section";
import { ChromeScrim } from "@/components/layout/chrome-scrim";
import { chromeControlsRow, chromePill, chromeSafeTop } from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";
import styles from "./onboarding-screen.module.css";

export function OnboardingScreen() {
  const { role, user, isLoggedIn, logout } = useAuthSession();
  const [showLocationToast, setShowLocationToast] = useState(false);
  const [isPopularVisible, setIsPopularVisible] = useState(false);

  // Estados para controlar o novo campo de busca de localização
  const [locationQuery, setLocationQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lowerSectionRef = useRef<HTMLDivElement>(null);

  // Fecha o menu de sugestões ao clicar fora do componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Observa quando a seção inferior entra em tela para ocultar o botão automaticamente
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPopularVisible(entry.intersectionRatio >= 0.2);
      },
      { threshold: 0.2 },
    );

    const target = lowerSectionRef.current;
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, []);

  // Função auxiliar para remover acentos
  const removeAccents = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // Filtra as localidades ignorando maiúsculas/minúsculas e acentos
  const filteredLocations = locationsData.filter((loc) => {
    const searchStr = removeAccents(`${loc.city}, ${loc.state}`.toLowerCase());
    const queryStr = removeAccents(locationQuery.toLowerCase());
    return searchStr.includes(queryStr);
  });

  const scrollToPopularSection = () => {
    document.getElementById("popular-links-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const shouldShowScrollButton = !isPopularVisible;

  return (
    <div className="relative w-full overflow-x-clip bg-white">
      {/* Hero Section */}
      <section className={`relative w-full flex flex-col ${styles.hero}`}>
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/homepage-main-photo-2.webp"
            alt="Sigillus Premium Background"
            fill
            className={`object-cover ${styles.heroImage}`}
            priority
            sizes="100vw"
            unoptimized
            quality={90}
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/25 to-black/55"></div>
        </div>

        <header className="absolute inset-x-0 top-0 z-30 isolate overflow-visible pointer-events-none">
          <ChromeScrim variant="dark" />
          <div
            className={cn(
              chromeControlsRow,
              chromeSafeTop,
              "mx-auto box-border flex w-full max-w-384 items-center justify-between gap-3 px-6 pb-4 md:px-12 md:pb-5",
            )}
          >
            <BrandWordmark tone="light" className="transition-opacity hover:opacity-90" />
            {isLoggedIn ? (
              <AccountMenu role={role} user={user} onLogout={logout} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className={cn(chromePill, "px-4 text-sm font-bold text-zinc-900")}
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/cadastro"
                  className={cn(
                    chromePill,
                    "border-white/40 bg-white px-5 text-sm font-extrabold tracking-tight text-[#800020] hover:bg-zinc-100",
                  )}
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Conteúdo Principal do Hero */}
        <div
          className={`relative z-10 box-border max-w-384 mx-auto px-6 md:px-12 w-full flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between ${styles.heroContent}`}
        >
          {/* Texto (Esquerda) */}
          <div className="mx-auto w-full max-w-xl text-white lg:mx-0 lg:min-w-0 lg:flex-1 xl:max-w-2xl">
            <h1 className="text-balance text-center text-[1.75rem] font-extrabold leading-tight tracking-tight drop-shadow-md sm:text-4xl lg:text-left lg:text-5xl xl:text-6xl">
              Nem todo luxo <br className="hidden lg:block" />
              se anuncia.
            </h1>
          </div>

          {/* Card de Formulário (Direita) */}
          <div
            className={`relative mx-auto mt-auto w-full lg:mt-0 lg:mr-0 lg:ml-auto lg:min-w-0 ${styles.cardWrapper}`}
          >
            {shouldShowScrollButton && (
              <button
                type="button"
                onClick={scrollToPopularSection}
                className="fixed bottom-4 left-1/2 z-40 inline-flex -translate-x-1/2 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-white/60 bg-black/55 px-3.5 py-1.5 text-sm font-semibold tracking-wide text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <span>Role para ver mais</span>
                <svg
                  className="h-4 w-4 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}

            <Card className="space-y-3 rounded-2xl bg-white p-4 shadow-2xl md:space-y-6 md:p-7 lg:p-8 xl:p-10">
              <h2 className="mb-2 hidden text-2xl font-extrabold tracking-tight text-zinc-900 md:block">
                Comece sua experiência:
              </h2>

              <div className="space-y-4">
                {/* Novo Campo de Localização Unificado */}
                <div className="relative space-y-1.5" ref={wrapperRef}>
                  <div className="flex items-baseline justify-between gap-2">
                    <label htmlFor="location" className="text-sm font-semibold text-zinc-900">
                      Localização
                    </label>
                    <button
                      type="button"
                      className="text-xs font-bold text-wine-800 hover:underline"
                      onClick={() => {
                        setShowLocationToast(true);
                        setLocationQuery("São Paulo, SP");
                        setTimeout(() => setShowLocationToast(false), 3000);
                      }}
                    >
                      Usar minha localização
                    </button>
                  </div>
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute inset-y-0 left-3 my-auto text-wine-700 pointer-events-none"
                      aria-hidden="true"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <input
                      id="location"
                      type="text"
                      placeholder="Digite sua cidade..."
                      value={locationQuery}
                      onChange={(e) => {
                        setLocationQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 pl-9 py-2 text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-[#800020] focus:ring-1 focus:ring-[#800020]"
                      autoComplete="off"
                    />
                  </div>

                  {/* Dropdown de Sugestões */}
                  {showSuggestions && locationQuery.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-60 overflow-auto py-1 text-sm">
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map((loc, idx) => (
                          <li key={idx}>
                            <button
                              type="button"
                              className="w-full px-3 py-2 hover:bg-zinc-100 cursor-pointer text-left text-zinc-700 flex items-center gap-2"
                              onClick={() => {
                                setLocationQuery(`${loc.state}, ${loc.city}`);
                                setShowSuggestions(false);
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="shrink-0 text-wine-700"
                                aria-hidden="true"
                              >
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              <span>
                                {loc.state}, {loc.city}
                              </span>
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-zinc-500">Nenhuma cidade encontrada</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Categoria com defaultValue corrigido para "Feminina" */}
                <Select
                  id="category"
                  label="Categoria"
                  options={categories.map((value) => ({ value, label: value }))}
                  defaultValue="Feminina"
                />
              </div>

              <Link
                href={`/feed?location=${encodeURIComponent(locationQuery)}`}
                className="block pt-2"
              >
                <Button
                  fullWidth
                  size="lg"
                  className="rounded-lg bg-[#800020] py-3 text-base text-white shadow-lg hover:bg-[#600018] md:py-6"
                >
                  Entrar no feed
                </Button>
              </Link>

              {showLocationToast && (
                <Toast
                  title="Localização atual aplicada"
                  message="São Paulo, SP foi definida automaticamente."
                  type="success"
                />
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* Seção Inferior */}
      <div id="popular-links-section" ref={lowerSectionRef} className="bg-white relative z-20">
        <div className="box-border max-w-384 mx-auto px-6 md:px-12 py-10 md:py-12">
          <PopularLinksSection />
        </div>
      </div>
    </div>
  );
}
