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
import { readRedirectTarget } from "@/lib/auth-return";
import { useAuthSession } from "@/lib/auth-session";
import {
  formatCpf,
  validateCpf,
  validateEmailPair,
  validatePasswordPair,
  validateRequiredName,
} from "@/lib/identity";

const clientImages = [
  "/images/personas/persona2/persona2-client-signup-1.webp",
  "/images/personas/persona3/persona3-client-signup-2.webp",
  "/images/personas/persona4/persona4-client-signup-3.webp",
];

const clientHeroImages = [
  { src: clientImages[0], heroPosition: "center 25%" },
  { src: clientImages[1], heroPosition: "center" },
  { src: clientImages[2], heroPosition: "center" },
];

export function ClientSignupScreen() {
  const router = useRouter();
  const { setRole } = useAuthSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cpfValue, setCpfValue] = useState("");
  const [fullName, setFullName] = useState("");
  const [nicknameEnabled, setNicknameEnabled] = useState(false);
  const [nickname, setNickname] = useState("");

  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [emailError, setEmailError] = useState<string | undefined>();
  const [confirmEmailError, setConfirmEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>();
  const [cpfError, setCpfError] = useState<string | undefined>();
  const [fullNameError, setFullNameError] = useState<string | undefined>();
  const [shakeStep, setShakeStep] = useState<1 | 2 | null>(null);

  const [toast, setToast] = useState<{
    title: string;
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const clientSteps: StepItem[] = [
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

  const clearCredentialErrors = () => {
    setEmailError(undefined);
    setConfirmEmailError(undefined);
    setPasswordError(undefined);
    setConfirmPasswordError(undefined);
  };

  const clearStepOneErrors = () => {
    setCpfError(undefined);
    setFullNameError(undefined);
  };

  const triggerShake = (targetStep: 1 | 2) => {
    setShakeStep(targetStep);
    window.setTimeout(
      () => setShakeStep((current) => (current === targetStep ? null : current)),
      320,
    );
  };

  const handleCpfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCpfValue(formatCpf(event.target.value));
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % clientImages.length);
    }, 4500); // 4.5s per image
    return () => window.clearInterval(intervalId);
  }, []);

  const handleNicknameToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setNicknameEnabled(enabled);

    if (!enabled) {
      setNickname("");
    }
  };

  const validateStepOne = () => {
    clearStepOneErrors();
    const cpfErrorMessage = validateCpf(cpfValue);
    const nameErrorMessage = validateRequiredName(fullName, "full");
    if (cpfErrorMessage) setCpfError(cpfErrorMessage);
    if (nameErrorMessage) setFullNameError(nameErrorMessage);
    if (cpfErrorMessage || nameErrorMessage) {
      triggerShake(1);
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStepOne()) {
      showToast({
        title: "Calma, falta um detalhe",
        message: "Preenche os campos obrigatórios do passo 1 pra gente seguir.",
        type: "error",
      });
      return;
    }

    setStep(2);
  };

  const prevStep = () => {
    clearCredentialErrors();
    setStep((current) => (current === 3 ? 2 : 1));
  };

  const validateStepTwo = () => {
    clearCredentialErrors();
    const emailErrors = validateEmailPair(email, confirmEmail);
    const passwordErrors = validatePasswordPair(password, confirmPassword);
    if (emailErrors.email) setEmailError(emailErrors.email);
    if (emailErrors.confirmEmail) setConfirmEmailError(emailErrors.confirmEmail);
    if (passwordErrors.password) setPasswordError(passwordErrors.password);
    if (passwordErrors.confirmPassword) setConfirmPasswordError(passwordErrors.confirmPassword);
    const hasError = Boolean(
      emailErrors.email ||
      emailErrors.confirmEmail ||
      passwordErrors.password ||
      passwordErrors.confirmPassword,
    );
    if (hasError) {
      triggerShake(2);
      showToast({
        title: "Quase lá, só um ajuste",
        message: "E-mail ou senha precisam de um ajuste. Confere e tenta de novo?",
        type: "error",
      });
      return false;
    }
    return true;
  };

  const handleFinishSignup = () => {
    if (!validateStepTwo()) {
      return;
    }

    setStep(3);
  };

  const handleCreateAccount = () => {
    setRole("cliente");
    showToast({
      title: "Conta criada com sucesso!",
      message: "Bem-vindo ao Sigillus.",
      type: "success",
    });
    const destination = readRedirectTarget();
    // Dá um tempo curto para o usuário ver o toast antes de mudar de tela
    setTimeout(() => {
      router.push(destination);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 md:grid md:grid-cols-2 md:items-start">
      <section className="hidden h-screen bg-black md:sticky md:top-0 md:block">
        <div className="relative h-full w-full overflow-hidden">
          {clientImages.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Modelo para criacao de conta cliente ${index + 1}`}
              fill
              priority={index === 0}
              quality={90}
              className={`object-cover object-center transition-opacity duration-1000 ease-in-out ${
                index === activeImageIndex ? "opacity-90" : "opacity-0"
              }`}
              sizes="50vw"
            />
          ))}
          <div className="absolute inset-0 bg-linear-to-br from-black/55 via-black/25 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-wine-900/35 via-transparent to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-end px-10 pb-14 text-white lg:px-14">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
              Cadastro cliente
            </p>
            <h2 className="mt-4 max-w-lg font-display text-5xl leading-[0.95] text-white lg:text-6xl">
              Controle premium da sua experiencia.
            </h2>
            <div className="mt-7 h-px w-24 bg-white/45" />
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
              Entre em um ambiente com suporte dedicado, perfis publicados pelas proprias
              profissionais e chat seguro.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 md:flex md:min-h-screen md:items-center md:justify-center md:px-10 md:py-10">
        <AuthHeroMobile
          images={clientHeroImages}
          activeIndex={activeImageIndex}
          eyebrow="Cadastro cliente"
        />

        <div className="mx-auto mt-6 w-full max-w-md space-y-6 md:mt-0">
          <header>
            <div className="hidden items-center gap-2 md:flex">
              <BackButton />
              <BrandWordmark />
            </div>
            <h1 className="text-3xl font-semibold text-zinc-900 md:mt-4">
              Crie sua conta Sigillus
            </h1>
            <p className="mt-1 text-base text-zinc-700">
              Inicie sua jornada no ecossistema e experimente o padrão de excelência.
            </p>
          </header>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-300/40 md:p-6">
            <div className="mb-10 px-2 sm:px-6">
              <Stepper steps={clientSteps} currentStep={step} />
            </div>

            <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-4 space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                      Dados Iniciais
                    </h2>
                    <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                      Informe seus dados civis e configure como deseja ser chamada(o).
                    </p>
                  </div>

                  <Input
                    id="cpf"
                    label="Seu CPF"
                    placeholder="000.000.000-00"
                    value={cpfValue}
                    onChange={handleCpfChange}
                    maxLength={14}
                    error={cpfError}
                    className={shakeStep === 1 && cpfError ? "field-shake" : undefined}
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
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M8 8h8" />
                        <path d="M8 12h5" />
                      </svg>
                    }
                  />

                  <Input
                    id="full-name"
                    label="Nome completo civil"
                    placeholder="Como consta no seu documento"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    error={fullNameError}
                    className={shakeStep === 1 && fullNameError ? "field-shake" : undefined}
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

                  <div className="rounded-xl border border-zinc-200 bg-white/40 p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          Usar apelido (opcional)
                        </p>
                        <p className="text-xs text-zinc-600">
                          Ative se quiser ser chamada(o) por um nome alternativo.
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={nicknameEnabled}
                          onChange={handleNicknameToggle}
                          aria-label="Usar apelido"
                        />
                        <div className="h-5 w-9 rounded-full bg-zinc-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-wine-700 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                      </label>
                    </div>
                    {nicknameEnabled ? (
                      <div className="mt-3">
                        <Input
                          id="nickname"
                          label="Apelido"
                          placeholder="Como deseja ser chamado(a)"
                          value={nickname}
                          onChange={(event) => setNickname(event.target.value)}
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

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-4 space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                      Credenciais de Acesso
                    </h2>
                    <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                      Confirme e-mail e senha para proteger o acesso da sua conta.
                    </p>
                  </div>

                  <Input
                    id="email"
                    label="E-mail principal"
                    type="email"
                    placeholder="voce@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    error={emailError}
                    className={shakeStep === 2 && emailError ? "field-shake" : undefined}
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
                    label="Confirmar e-mail"
                    type="email"
                    placeholder="Repita seu e-mail"
                    value={confirmEmail}
                    onChange={(event) => setConfirmEmail(event.target.value)}
                    error={confirmEmailError}
                    className={shakeStep === 2 && confirmEmailError ? "field-shake" : undefined}
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
                        <path d="M4 4h16v16H4z" />
                        <path d="m4 8 8 5 8-5" />
                      </svg>
                    }
                  />

                  <Input
                    id="password"
                    label="Crie sua senha"
                    type="password"
                    placeholder="Minimo 8 caracteres"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={passwordError}
                    className={shakeStep === 2 && passwordError ? "field-shake" : undefined}
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
                    label="Confirmar senha"
                    type="password"
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    error={confirmPasswordError}
                    className={shakeStep === 2 && confirmPasswordError ? "field-shake" : undefined}
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
                      title="Ambiente protegido"
                      description="Seus dados passam por criptografia ponta a ponta e monitoramento continuo de seguranca."
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
                    <div className="mt-2 flex flex-wrap gap-2 pl-11 text-[11px] font-semibold uppercase tracking-[0.12em] text-wine-800">
                      <span className="rounded-full border border-wine-300 bg-wine-50 px-2.5 py-1">
                        Seguro
                      </span>
                      <span className="rounded-full border border-wine-300 bg-wine-50 px-2.5 py-1">
                        SSL
                      </span>
                      <span className="rounded-full border border-wine-300 bg-wine-50 px-2.5 py-1">
                        LGPD
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-4 space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                      Revisão Final
                    </h2>
                    <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                      Tudo pronto. Confira os dados obrigatórios e finalize sua conta.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                    <p className="font-semibold text-zinc-900">Dados validados</p>
                    <ul className="mt-2 space-y-1">
                      <li>CPF e nome civil preenchidos</li>
                      <li>E-mail confirmado</li>
                      <li>Senha confirmada</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {step > 1 ? (
                  <>
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
                    {step === 2 ? (
                      <Button
                        type="button"
                        size="lg"
                        onClick={handleFinishSignup}
                        className="w-2/3 shadow-md shadow-wine-700/20"
                      >
                        Continuar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="lg"
                        onClick={handleCreateAccount}
                        className="w-2/3 shadow-md shadow-wine-700/20"
                      >
                        Criar conta
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    type="button"
                    fullWidth
                    size="lg"
                    onClick={nextStep}
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
                )}
              </div>
            </form>

            {toast ? <Toast title={toast.title} message={toast.message} type={toast.type} /> : null}

            <div className="mt-8 border-t border-zinc-100 pt-6 text-center text-sm text-zinc-600">
              <p>
                Ja possui cadastro?{" "}
                <Link href="/auth/login" className="font-bold text-wine-700 hover:underline">
                  Acesse sua conta
                </Link>
              </p>
              {/* Aumentamos a margem, a fonte para text-sm e o contraste */}
              <p className="mt-4 border-t border-dashed border-zinc-200 pt-4 text-sm text-zinc-600">
                Voce e profissional e quer se cadastrar?{" "}
                {/* Link agora usa a cor da marca (wine-700) e font-bold */}
                <Link
                  href="/auth/cadastro/profissional"
                  className="font-bold text-wine-700 hover:underline"
                >
                  Anuncie seu perfil aqui
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
