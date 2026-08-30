"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ShieldCheck, CheckCircle2 } from "lucide-react";
import { AuthHeroMobile } from "@/components/ui/auth-hero-mobile";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { Stepper, StepItem } from "@/components/ui/stepper";
import { useAuthSession } from "@/lib/auth-session";

const professionalImages = [
  "/images/professional-signup/stacked-cards-1.webp",
  "/images/professional-signup/stacked-cards-2.webp",
  "/images/personas/persona2/persona2-professional-card.webp",
];

const professionalHeroImages = [
  { src: professionalImages[0], heroPosition: "center" },
  { src: professionalImages[1], heroPosition: "center" },
  { src: professionalImages[2], heroPosition: "center" },
];

export function ProfessionalSignupScreen() {
  const router = useRouter();
  const { setRole } = useAuthSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [cpf, setCpf] = useState("");
  const [civilName, setCivilName] = useState("");
  const [artisticNameEnabled, setArtisticNameEnabled] = useState(false);
  const [artisticName, setArtisticName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shakeStep, setShakeStep] = useState<1 | 2 | null>(null);
  const [stepOneErrors, setStepOneErrors] = useState<{ cpf?: string; civilName?: string }>({});
  const [stepTwoErrors, setStepTwoErrors] = useState<{
    phone?: string;
    email?: string;
    confirmEmail?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const professionalSteps: StepItem[] = [
    { id: 1, label: "Identidade", icon: <User size={20} strokeWidth={2.5} /> },
    { id: 2, label: "Segurança", icon: <ShieldCheck size={20} strokeWidth={2.5} /> },
    { id: 3, label: "Sucesso", icon: <CheckCircle2 size={20} strokeWidth={2.5} /> },
  ];

  const iconClassName = "h-4 w-4";

  const showToast = (payload: {
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }) => {
    setToast(payload);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateAccount = () => {
    setRole("profissional");
    showToast({
      title: "Conta criada com sucesso!",
      message: "Redirecionando para o seu dashboard...",
      type: "success",
    });
    setTimeout(() => {
      router.push("/profissional/dashboard");
    }, 1000);
  };

  const handleArtisticNameToggle = (enabled: boolean) => {
    setArtisticNameEnabled(enabled);
    if (!enabled) {
      setArtisticName("");
    }
  };

  const triggerShake = (targetStep: 1 | 2) => {
    setShakeStep(targetStep);
    window.setTimeout(
      () => setShakeStep((current) => (current === targetStep ? null : current)),
      320,
    );
  };

  const validateStepOne = () => {
    const errors: { cpf?: string; civilName?: string } = {};

    if (cpf.replace(/\D/g, "").length !== 11) {
      errors.cpf = "Informe um CPF válido.";
    }

    if (!civilName.trim()) {
      errors.civilName = "Informe seu nome civil.";
    }

    setStepOneErrors(errors);

    if (Object.keys(errors).length > 0) {
      triggerShake(1);
      return false;
    }

    return true;
  };

  const validateStepTwo = () => {
    const errors: {
      phone?: string;
      email?: string;
      confirmEmail?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!phone.trim()) {
      errors.phone = "Informe seu telefone.";
    }

    if (!email.trim()) {
      errors.email = "Informe seu e-mail.";
    }

    if (!confirmEmail.trim()) {
      errors.confirmEmail = "Confirme seu e-mail.";
    }

    if (email.trim() && confirmEmail.trim() && email.trim() !== confirmEmail.trim()) {
      errors.email = "Os e-mails devem ser iguais.";
      errors.confirmEmail = "Os e-mails devem ser iguais.";
    }

    if (!password.trim()) {
      errors.password = "Informe sua senha.";
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Confirme sua senha.";
    }

    if (password && confirmPassword && password !== confirmPassword) {
      errors.password = "As senhas devem ser iguais.";
      errors.confirmPassword = "As senhas devem ser iguais.";
    }

    setStepTwoErrors(errors);

    if (Object.keys(errors).length > 0) {
      triggerShake(2);
      return false;
    }

    return true;
  };

  const nextFromStepOne = () => {
    if (!validateStepOne()) {
      return;
    }

    setStep(2);
  };

  const nextFromStepTwo = () => {
    if (!validateStepTwo()) {
      return;
    }

    setStep(3);
  };

  const prevStep = () => {
    setStep((currentStep) => (currentStep === 3 ? 2 : 1));
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    const firstPart = digits.slice(0, 3);
    const secondPart = digits.slice(3, 6);
    const thirdPart = digits.slice(6, 9);
    const lastPart = digits.slice(9, 11);

    if (digits.length <= 3) {
      return firstPart;
    }

    if (digits.length <= 6) {
      return `${firstPart}.${secondPart}`;
    }

    if (digits.length <= 9) {
      return `${firstPart}.${secondPart}.${thirdPart}`;
    }

    return `${firstPart}.${secondPart}.${thirdPart}-${lastPart}`;
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();

    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveCardIndex((currentIndex) => (currentIndex + 1) % professionalImages.length);
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="min-h-screen bg-zinc-50 md:grid md:grid-cols-2 md:items-start">
      <section className="hidden h-screen bg-black md:sticky md:top-0 md:block">
        <div className="relative h-full w-full overflow-hidden">
          {professionalImages.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Modelo para cadastro profissional ${index + 1}`}
              fill
              priority={index === 0}
              quality={90}
              className={`object-cover object-center transition-opacity duration-1000 ease-in-out ${index === activeCardIndex ? "opacity-90" : "opacity-0"}`}
              sizes="50vw"
            />
          ))}
          <div className="absolute inset-0 bg-linear-to-br from-black/55 via-black/25 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-wine-900/35 via-transparent to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-end px-10 pb-14 text-white lg:px-14">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
              Independent &amp; Verified
            </p>
            <h2 className="mt-4 max-w-lg font-display text-5xl leading-[0.95] text-white lg:text-6xl">
              Você decide quanto ganha.
            </h2>
            <div className="mt-7 h-px w-24 bg-white/45" />
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
              Controle total da sua agenda, preços e privacidade — tudo em um lugar.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 md:flex md:h-screen md:overflow-y-auto md:items-center md:justify-center md:px-10 md:py-10">
        <AuthHeroMobile
          images={professionalHeroImages}
          activeIndex={activeCardIndex}
          eyebrow="Independent & Verified"
        />

        <div className="mx-auto mt-6 w-full max-w-md space-y-6 md:mt-0">
          <header>
            <div className="hidden items-center gap-2 md:flex">
              <BackButton />
              <BrandWordmark />
            </div>
            <h1 className="text-3xl font-semibold text-zinc-900 md:mt-4">
              Criar conta profissional
            </h1>
            <p className="mt-1 text-base text-zinc-700">
              Inicie seu perfil e faça parte da seleção exclusiva Sigillus.
            </p>
          </header>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-300/40 md:p-6">
            <div className="mb-10 px-2 sm:px-6">
              <Stepper steps={professionalSteps} currentStep={step} />
            </div>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* PASSO 1 */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1 mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                      Dados Iniciais
                    </h2>
                    <p className="text-sm text-zinc-700">
                      Seu perfil inicia com CPF, nome civil e nome artístico opcional.
                    </p>
                  </div>

                  <Input
                    id="cpf"
                    label="CPF"
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={14}
                    premium
                    value={cpf}
                    onChange={(event) => setCpf(formatCpf(event.target.value))}
                    error={stepOneErrors.cpf}
                    className={shakeStep === 1 && stepOneErrors.cpf ? "field-shake" : undefined}
                    leadingIcon={
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={iconClassName}
                      >
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M8 8h8" />
                        <path d="M8 12h5" />
                      </svg>
                    }
                  />
                  <Input
                    id="civil-name"
                    label="Nome Civil"
                    placeholder="Nome completo conforme documento"
                    value={civilName}
                    onChange={(event) => setCivilName(event.target.value)}
                    error={stepOneErrors.civilName}
                    className={
                      shakeStep === 1 && stepOneErrors.civilName ? "field-shake" : undefined
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
                        className={iconClassName}
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M5 20a7 7 0 0 1 14 0" />
                      </svg>
                    }
                  />
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          Nome artístico (opcional)
                        </p>
                        <p className="text-xs text-zinc-600">
                          Ative caso deseje ser chamada(o) pelo seu nome artístico.
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={artisticNameEnabled}
                          onChange={(event) => handleArtisticNameToggle(event.target.checked)}
                          aria-label="Usar nome artístico"
                        />
                        <div className="h-5 w-9 rounded-full bg-zinc-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-wine-700 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                      </label>
                    </div>

                    {artisticNameEnabled ? (
                      <div className="mt-3">
                        <Input
                          id="artistic-name"
                          label="Nome artístico"
                          placeholder="Como deseja ser vista(o)"
                          value={artisticName}
                          onChange={(event) => setArtisticName(event.target.value)}
                          premium
                          leadingIcon={
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={iconClassName}
                            >
                              <path d="m12 3 2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5Z" />
                            </svg>
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* PASSO 2 */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1 mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                      Credenciais de Acesso
                    </h2>
                    <p className="text-sm text-zinc-700">
                      Informe telefone, e-mail e senha para proteger o acesso da conta.
                    </p>
                  </div>

                  <Input
                    id="phone"
                    label="Telefone"
                    type="tel"
                    placeholder="+55 (00) 00000-0000"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    error={stepTwoErrors.phone}
                    className={shakeStep === 2 && stepTwoErrors.phone ? "field-shake" : undefined}
                    premium
                    leadingIcon={
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={iconClassName}
                      >
                        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3.1 19.3 19.3 0 0 1-6-6A19.7 19.7 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.8 2.6a2 2 0 0 1-.4 2.1L8.2 9.8a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2.1-.4c.8.4 1.7.7 2.6.8A2 2 0 0 1 22 16.9Z" />
                      </svg>
                    }
                  />

                  <Input
                    id="email"
                    label="E-mail"
                    type="email"
                    placeholder="voce@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    error={stepTwoErrors.email}
                    className={shakeStep === 2 && stepTwoErrors.email ? "field-shake" : undefined}
                    premium
                    leadingIcon={
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={iconClassName}
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m4 7 8 6 8-6" />
                      </svg>
                    }
                  />

                  <Input
                    id="confirm-email"
                    label="Confirmação de email"
                    type="email"
                    placeholder="Repita seu e-mail"
                    value={confirmEmail}
                    onChange={(event) => setConfirmEmail(event.target.value)}
                    premium
                    leadingIcon={
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={iconClassName}
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m4 7 8 6 8-6" />
                        <path d="m9.5 12.5 1.5 1.5 3.5-3.5" />
                      </svg>
                    }
                    error={stepTwoErrors.confirmEmail}
                    className={
                      shakeStep === 2 && stepTwoErrors.confirmEmail ? "field-shake" : undefined
                    }
                  />

                  <Input
                    id="password"
                    label="Senha"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={stepTwoErrors.password}
                    className={
                      shakeStep === 2 && stepTwoErrors.password ? "field-shake" : undefined
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
                        className={iconClassName}
                      >
                        <rect x="4" y="11" width="16" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                    }
                  />

                  <Input
                    id="confirm-password"
                    label="Confirmação de senha"
                    type="password"
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    error={stepTwoErrors.confirmPassword}
                    className={
                      shakeStep === 2 && stepTwoErrors.confirmPassword ? "field-shake" : undefined
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
                        className={iconClassName}
                      >
                        <rect x="4" y="11" width="16" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                        <path d="M9 16h6" />
                      </svg>
                    }
                  />

                  <div className="pt-2 pb-1">
                    <InfoBanner
                      title="Perfil profissional protegido"
                      description="As demais informações do perfil serão solicitadas após o login, na área de gerenciamento da conta."
                      tone="secure"
                      icon={
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={iconClassName}
                        >
                          <path d="M12 2a10 10 0 0 0-7 3v6c0 6 7 11 7 11s7-5 7-11V5a10 10 0 0 0-7-3Z" />
                          <path d="M8.5 11a3.5 3.5 0 0 1 7 0" />
                          <path d="M9 14h6" />
                        </svg>
                      }
                    />
                    <div className="mt-2 flex gap-2 pl-11 text-[11px] font-semibold uppercase tracking-[0.12em] text-wine-800">
                      <span className="rounded-full border border-wine-300 bg-wine-50 px-2.5 py-1">
                        Seguro
                      </span>
                      <span className="rounded-full border border-wine-300 bg-wine-50 px-2.5 py-1">
                        Login
                      </span>
                      <span className="rounded-full border border-wine-300 bg-wine-50 px-2.5 py-1">
                        Conta
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-wine-700">
                      Quase lá
                    </span>
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                      Revisão Final
                    </h2>
                    <p className="text-sm text-zinc-700">
                      Confira os dados obrigatórios validados e finalize seu cadastro.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm font-semibold text-zinc-900">Dados prontos para envio</p>
                    <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                      <li>CPF validado</li>
                      <li>Nome civil preenchido</li>
                      <li>Telefone, e-mail e senha confirmados</li>
                    </ul>
                  </div>

                  <InfoBanner
                    title="Quase lá"
                    description="Após concluir, você será direcionada(o) para gerenciar o perfil completo na conta."
                    tone="info"
                  />
                </div>
              )}

              {/* CONTROLES DE NAVEGAÇÃO */}
              <div className="pt-2 flex gap-3">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={prevStep}
                    className="w-1/3"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1.5 h-4 w-4"
                    >
                      <path d="m12 19-7-7 7-7" />
                      <path d="M19 12H5" />
                    </svg>
                    Voltar
                  </Button>
                )}

                {step === 1 ? (
                  <Button
                    type="button"
                    fullWidth
                    size="lg"
                    onClick={nextFromStepOne}
                    className="shadow-md shadow-wine-700/20"
                  >
                    Continuar
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-1.5 h-4 w-4"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Button>
                ) : step === 2 ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={nextFromStepTwo}
                    className="w-2/3 shadow-md shadow-wine-700/20"
                  >
                    Continuar para verificacao
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-1.5 h-4 w-4"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleCreateAccount}
                    className="w-2/3 shadow-md shadow-wine-700/20"
                  >
                    Criar conta profissional
                  </Button>
                )}
              </div>

              <p className="text-center text-sm text-zinc-600">
                Ainda não tem conta cliente?{" "}
                <Link
                  href="/auth/cadastro"
                  className="font-semibold text-wine-800 hover:text-wine-900 hover:underline"
                >
                  Criar conta grátis
                </Link>
              </p>
            </form>

            {toast ? <Toast title={toast.title} message={toast.message} type={toast.type} /> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
