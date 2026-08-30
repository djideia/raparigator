"use client";

import { useEffect, useState, type ChangeEvent } from "react";

import { Modal } from "../ui/modal";
import { AppShell } from "../layout/app-shell";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { useAuthSession } from "../../lib/auth-session";
import { useAccountNotifications } from "../../lib/account-notifications";
import { getRoleLabel } from "../../lib/navigation";
import {
  formatCpf,
  formatPhone,
  getProfileFieldErrors,
  isProfileFormComplete,
  validatePasswordPair,
} from "@/lib/identity";
import { getVerificationState } from "@/lib/verification";
import type { AuthRole, MockUser } from "../../lib/types";

interface ProfileFormState {
  fullName: string;
  alias: string;
  cpf: string;
  email: string;
  confirmEmail: string;
  phone: string;
  city: string;
  preference: string;
}
const profileCompleteKey = (role: AuthRole) => `sigillus-account-profile-complete-${role}`;
const profileFormKey = (role: AuthRole, userEmail: string) =>
  `sigillus-account-profile-form-${role}-${userEmail.toLowerCase()}`;
const SAVE_CONFIRMATION_AUTO_DISMISS_MS = 3200;

type ProfileFieldErrors = Partial<Record<keyof ProfileFormState, string>>;

function initialFormState(user: MockUser | null): ProfileFormState {
  return {
    fullName: user?.fullName ?? "",
    alias: user?.alias ?? "",
    cpf: user?.cpf ?? "",
    email: user?.email ?? "",
    confirmEmail: user?.email ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    preference: "",
  };
}

function readStoredForm(key: string, user: MockUser | null): ProfileFormState {
  if (typeof window === "undefined") {
    return initialFormState(user);
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return initialFormState(user);
    }

    const parsed = JSON.parse(raw) as Partial<ProfileFormState>;
    return {
      ...initialFormState(user),
      ...parsed,
    };
  } catch {
    return initialFormState(user);
  }
}

export function AccountScreen() {
  const { role, user } = useAuthSession();

  if (!user || role === "visitor") {
    return (
      <AppShell>
        <EmptyState
          title="Ei, falta um convite"
          description="Entra com sua conta de Cliente ou Profissional pra gente continuar essa conversinha com estilo."
          actionLabel="Entrar"
          onAction={() => {
            window.location.href = "/auth/login";
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AccountWorkspace key={role} role={role} user={user} />
    </AppShell>
  );
}

function AccountWorkspace({ role, user }: { role: Exclude<AuthRole, "visitor">; user: MockUser }) {
  const { unreadCount, bannerClosed, setBannerClosed, markAllAsRead } =
    useAccountNotifications(role);
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormState>(() =>
    readStoredForm(profileFormKey(role, user.email), user),
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  const [passwordModalSuccess, setPasswordModalSuccess] = useState(false);
  const profileCompleted = isProfileFormComplete(role, form);

  const clearFieldError = <FieldName extends keyof ProfileFormState>(fieldName: FieldName) => {
    setFieldErrors((current) => {
      if (!current[fieldName]) return current;
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
  };

  const updateField =
    <FieldName extends keyof ProfileFormState>(fieldName: FieldName) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setForm((current) => ({ ...current, [fieldName]: value }));
      setSaveMessage(null);
      clearFieldError(fieldName);
    };

  const handleCpfChange = (event: ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCpf(event.target.value);
    setForm((current) => ({ ...current, cpf: formattedValue }));
    setSaveMessage(null);
    clearFieldError("cpf");
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, phone: formatPhone(event.target.value) }));
    setSaveMessage(null);
    clearFieldError("phone");
  };

  const handlePasswordChange = () => {
    setPasswordModalError(null);
    const pair = validatePasswordPair(newPassword, confirmNewPassword);
    const firstError = pair.password ?? pair.confirmPassword;
    if (firstError) {
      setPasswordModalError(firstError);
      return;
    }
    setPasswordModalSuccess(true);
    setTimeout(() => {
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordModalSuccess(false);
      setSaveMessage("Senha alterada com sucesso.");
    }, 1500);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(profileCompleteKey(role), String(profileCompleted));
  }, [profileCompleted, role]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(profileFormKey(role, user.email), JSON.stringify(form));
  }, [form, role, user.email]);

  useEffect(() => {
    if (!saveMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveMessage(null);
    }, SAVE_CONFIRMATION_AUTO_DISMISS_MS);

    return () => window.clearTimeout(timeoutId);
  }, [saveMessage]);

  const showBanner = !profileCompleted && !bannerClosed && unreadCount > 0;

  const openCompletionStep = () => {
    markAllAsRead();
    setBannerClosed(true);
    setTimeout(() => {
      document
        .getElementById("profile-workflow")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const validateForm = () => {
    const nextErrors = getProfileFieldErrors(role, {
      fullName: form.fullName,
      cpf: form.cpf,
      email: form.email,
      confirmEmail: form.confirmEmail,
      phone: form.phone,
      city: form.city,
      preference: form.preference,
    });
    setFieldErrors(nextErrors);
    const isValid = Object.keys(nextErrors).length === 0;
    setFormError(isValid ? null : "Revise os campos destacados para continuar.");
    return isValid;
  };

  const handleSaveProfile = () => {
    if (!validateForm()) {
      setSaveMessage(null);
      return;
    }
    markAllAsRead();
    setBannerClosed(true);
    setFieldErrors({});
    setFormError(null);
    setSaveMessage("Dados da conta salvos com sucesso.");
  };

  const openOperationalSettings = () => {
    window.location.href = "/profissional/dashboard?tab=Anúncio";
  };

  const openVerificationSettings = () => {
    window.location.href = "/profissional/dashboard?tab=Verificação";
  };

  const verificationState = getVerificationState(user.id, {
    email: user.email,
    phone: user.phone ?? "",
  });
  const verifiedItems = [verificationState.email.verified, verificationState.phone.verified].filter(
    Boolean,
  ).length;
  const verificationProgress = Math.round((verifiedItems / 2) * 100);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div
        aria-hidden={!saveMessage}
        className={`pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 transition-all duration-200 ease-out ${
          saveMessage ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div
          className={`w-full max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-900 shadow-xl backdrop-blur-sm transition-all duration-200 ease-out ${
            saveMessage ? "scale-100" : "scale-95"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p className="leading-relaxed">{saveMessage}</p>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Configuração da conta
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900">Dados da sua conta</h1>
          <p className="max-w-2xl text-sm text-zinc-600">
            {role === "cliente"
              ? "Mantenha seus dados atualizados para uma experiência mais segura e fluida dentro da plataforma."
              : "Edite seus dados de conta e segurança. Informações do anúncio são gerenciadas no painel profissional."}
          </p>
        </div>
      </section>

      {showBanner ? (
        <Card className="border-zinc-200 bg-white shadow-sm shadow-zinc-200/70">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Notificação
              </p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-900">
                Complete seu cadastro para liberar o restante da plataforma
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Você pode fechar este aviso e abrir novamente pelo sino de notificações.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setBannerClosed(true)}>
                Fechar
              </Button>
              <Button onClick={openCompletionStep}>Completar cadastro</Button>
            </div>
          </div>
        </Card>
      ) : null}

      <div id="profile-workflow">
        <Card className="space-y-5 border-zinc-200 bg-white shadow-sm shadow-zinc-200/70">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Cadastro essencial
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
                Informações de acesso e contato
              </h2>
            </div>
            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Perfil: {getRoleLabel(role)}
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="full-name"
                label="Nome"
                placeholder="Seu nome completo"
                value={form.fullName}
                onChange={updateField("fullName")}
                error={fieldErrors.fullName}
              />
              <Input
                id="alias"
                label={role === "cliente" ? "Apelido (opcional)" : "Nome Artístico (opcional)"}
                placeholder={
                  role === "cliente" ? "Como deseja ser chamado(a)" : "Como deseja ser vista(o)"
                }
                value={form.alias}
                onChange={updateField("alias")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="cpf"
                label="CPF"
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={handleCpfChange}
                error={fieldErrors.cpf}
                inputMode="numeric"
                maxLength={14}
              />
              <Input
                id="phone"
                label={role === "cliente" ? "Telefone" : "Telefone profissional"}
                type="tel"
                placeholder="+55 (00) 00000-0000"
                value={form.phone}
                onChange={handlePhoneChange}
                error={fieldErrors.phone}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="voce@email.com"
                value={form.email}
                onChange={updateField("email")}
                error={fieldErrors.email}
              />
              <Input
                id="confirm-email"
                label="Confirmação de Email"
                type="email"
                placeholder="Repita seu email"
                value={form.confirmEmail}
                onChange={updateField("confirmEmail")}
                error={fieldErrors.confirmEmail}
              />
            </div>

            {role === "cliente" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="city"
                    label="Cidade"
                    placeholder="Sua cidade principal"
                    value={form.city}
                    onChange={updateField("city")}
                    error={fieldErrors.city}
                  />
                  <Select
                    id="preference"
                    label="Preferência principal"
                    options={[
                      { value: "", label: "Selecione" },
                      { value: "feed", label: "Explorar o feed" },
                      { value: "chat", label: "Conversar pelo chat" },
                      { value: "premium", label: "Acompanhar perfis premium" },
                    ]}
                    value={form.preference}
                    onChange={updateField("preference")}
                    className={
                      fieldErrors.preference
                        ? "border-red-500 focus:border-red-600 focus:ring-red-200"
                        : undefined
                    }
                  />
                  {fieldErrors.preference ? (
                    <p className="-mt-2 text-xs text-red-600 sm:col-span-2">
                      {fieldErrors.preference}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Segurança
                      </p>
                      <p className="mt-1 font-medium text-zinc-900">Senha protegida</p>
                      <p className="mt-0.5 text-sm text-zinc-600">••••••••</p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      Alterar Senha
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Dados operacionais do anúncio
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-900">
                    Localização, disponibilidade e resumo público
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600">
                    Dados de anúncio são editados no painel profissional para manter tudo
                    centralizado.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="secondary" onClick={openOperationalSettings}>
                      Ir para gerenciar anúncio
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Segurança
                      </p>
                      <p className="mt-1 font-medium text-zinc-900">Senha protegida</p>
                      <p className="mt-0.5 text-sm text-zinc-600">••••••••</p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      Alterar Senha
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {role === "cliente" ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                Aqui você mantém dados de conta e preferências pessoais para usar a plataforma com
                segurança.
              </div>
            ) : null}

            {formError ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button type="button" onClick={handleSaveProfile} className="w-full sm:w-auto">
                Salvar dados da conta
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {role === "profissional" ? (
        <Card className="border-zinc-200 bg-white shadow-sm shadow-zinc-200/70">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Segurança e confiança
                </p>
                <h3 className="mt-1 text-xl font-semibold text-zinc-900">Verifique sua conta</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Aumente a confiança do seu perfil em poucos minutos. Seus dados de validação não
                  são compartilhados publicamente.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={openVerificationSettings}>
                Verificar agora
              </Button>
            </div>

            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${verificationProgress}%` }}
                />
              </div>
              <p className="text-xs font-medium text-zinc-500">
                {verifiedItems} de 2 etapas concluídas
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div
                className={`rounded-xl border p-3 ${verificationState.email.verified ? "border-emerald-200 bg-emerald-50/70" : "border-zinc-200 bg-zinc-50"}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  E-mail
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${verificationState.email.verified ? "text-emerald-700" : "text-zinc-700"}`}
                >
                  {verificationState.email.verified ? "Validado" : "Pendente"}
                </p>
              </div>
              <div
                className={`rounded-xl border p-3 ${verificationState.phone.verified ? "border-emerald-200 bg-emerald-50/70" : "border-zinc-200 bg-zinc-50"}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Telefone
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${verificationState.phone.verified ? "text-emerald-700" : "text-zinc-700"}`}
                >
                  {verificationState.phone.verified ? "Validado" : "Verificar"}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 opacity-75">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Documento
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-700">Em breve</p>
              </div>
            </div>
          </div>
        </Card>
      ) : null}
      <Modal
        open={showPasswordModal}
        title="Alterar Senha"
        description="Digite uma nova senha com no mínimo 8 caracteres para aumentar a segurança da sua conta."
        onClose={() => !passwordModalSuccess && setShowPasswordModal(false)}
        mobileCentered={true}
        actions={null}
      >
        <div className="space-y-5 max-w-md">
          {!passwordModalSuccess ? (
            <div className="space-y-4">
              <Input
                id="new-password"
                label="Nova senha"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordModalError(null);
                }}
              />
              <Input
                id="confirm-new-password"
                label="Confirmar nova senha"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  setPasswordModalError(null);
                }}
              />

              {passwordModalError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {passwordModalError}
                </div>
              ) : null}

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setPasswordModalError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={handlePasswordChange}>
                  Salvar Nova Senha
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-zinc-900">Senha alterada com sucesso!</p>
                <p className="mt-1 text-sm text-zinc-600">Você será redirecionado em breve.</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
