import type {
  EmailPairErrors,
  PasswordPairErrors,
  ProfileIdentityFieldErrors,
  ProfileIdentityForm,
  ProfileIdentityRole,
} from "@sigillus/contracts";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 8;
const CPF_LENGTH = 11;
const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 13;

export function sanitizeCpfDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, CPF_LENGTH);
}

export function formatCpf(value: string): string {
  const digits = sanitizeCpfDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function sanitizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS);
}

export function formatPhone(value: string): string {
  const digits = sanitizePhoneDigits(value);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return `+${digits}`;
  }

  if (digits.length <= 4) {
    return `+${digits.slice(0, 2)} (${digits.slice(2)}`;
  }

  if (digits.length <= 7) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
  }

  if (digits.length <= 11) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
}

export function validateCpf(value: string): string | null {
  if (sanitizeCpfDigits(value).length !== CPF_LENGTH) {
    return "Informe um CPF válido.";
  }
  return null;
}

export function validateRequiredName(value: string, kind: "full" | "civil"): string | null {
  if (value.trim()) {
    return null;
  }
  return kind === "civil" ? "Informe seu nome civil." : "Informe seu nome completo.";
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Informe seu e-mail.";
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Informe um e-mail válido.";
  }
  return null;
}

export function validateEmailPair(email: string, confirmEmail: string): EmailPairErrors {
  const errors: EmailPairErrors = {};
  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }

  if (!confirmEmail.trim()) {
    errors.confirmEmail = "Confirme seu e-mail.";
  } else if (!emailError && email.trim() !== confirmEmail.trim()) {
    errors.email = "Os e-mails devem ser iguais.";
    errors.confirmEmail = "Os e-mails devem ser iguais.";
  }

  return errors;
}

export function validatePasswordPair(
  password: string,
  confirmPassword: string,
): PasswordPairErrors {
  const errors: PasswordPairErrors = {};
  const trimmedPassword = password.trim();
  const passwordEmpty = !trimmedPassword;
  const passwordTooShort = !passwordEmpty && trimmedPassword.length < MIN_PASSWORD_LENGTH;

  if (passwordEmpty) {
    errors.password = "Informe sua senha.";
  } else if (passwordTooShort) {
    errors.password = "A senha deve ter ao menos 8 caracteres.";
  }

  if (!confirmPassword.trim()) {
    errors.confirmPassword = "Confirme sua senha.";
  } else if (!passwordEmpty && !passwordTooShort && password !== confirmPassword) {
    errors.password = "As senhas devem ser iguais.";
    errors.confirmPassword = "As senhas devem ser iguais.";
  }

  return errors;
}

export function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const national = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;

  if (national.length < MIN_PHONE_DIGITS) {
    return "Informe um telefone válido com DDD.";
  }
  return null;
}

export function getProfileFieldErrors(
  role: ProfileIdentityRole,
  form: ProfileIdentityForm,
): ProfileIdentityFieldErrors {
  const errors: ProfileIdentityFieldErrors = {};

  const fullNameError = validateRequiredName(form.fullName, "full");
  if (fullNameError) errors.fullName = fullNameError;

  const cpfError = validateCpf(form.cpf);
  if (cpfError) errors.cpf = cpfError;

  const emailPair = validateEmailPair(form.email, form.confirmEmail);
  if (emailPair.email) errors.email = emailPair.email;
  if (emailPair.confirmEmail) errors.confirmEmail = emailPair.confirmEmail;

  const phoneError = validatePhone(form.phone);
  if (phoneError) errors.phone = phoneError;

  if (role === "cliente") {
    if (!form.city.trim()) {
      errors.city = "Informe sua cidade.";
    }
    if (!form.preference.trim()) {
      errors.preference = "Selecione uma preferência principal.";
    }
  }

  return errors;
}

export function isProfileFormComplete(
  role: ProfileIdentityRole,
  form: ProfileIdentityForm,
): boolean {
  return Object.keys(getProfileFieldErrors(role, form)).length === 0;
}
