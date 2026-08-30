import { z } from "zod";

export const ProfileIdentityRoleSchema = z.enum(["cliente", "profissional"]);
export type ProfileIdentityRole = z.infer<typeof ProfileIdentityRoleSchema>;

export const ProfileIdentityFormSchema = z.object({
  fullName: z.string(),
  cpf: z.string(),
  email: z.string(),
  confirmEmail: z.string(),
  phone: z.string(),
  city: z.string(),
  preference: z.string(),
});
export type ProfileIdentityForm = z.infer<typeof ProfileIdentityFormSchema>;

export const ProfileIdentityFieldErrorsSchema = ProfileIdentityFormSchema.partial();
export type ProfileIdentityFieldErrors = z.infer<typeof ProfileIdentityFieldErrorsSchema>;

export const EmailPairErrorsSchema = z.object({
  email: z.string().optional(),
  confirmEmail: z.string().optional(),
});
export type EmailPairErrors = z.infer<typeof EmailPairErrorsSchema>;

export const PasswordPairErrorsSchema = z.object({
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
});
export type PasswordPairErrors = z.infer<typeof PasswordPairErrorsSchema>;

export const VerificationChannelSchema = z.enum(["email", "phone"]);
export type VerificationChannel = z.infer<typeof VerificationChannelSchema>;

export const VerificationChannelStateSchema = z.object({
  target: z.string(),
  verified: z.boolean(),
  verifiedAt: z.number().nullable(),
  pendingCode: z.string().nullable(),
  codeSentAt: z.number().nullable(),
  attempts: z.number(),
});
export type VerificationChannelState = z.infer<typeof VerificationChannelStateSchema>;

export const VerificationStateSchema = z.object({
  email: VerificationChannelStateSchema,
  phone: VerificationChannelStateSchema,
});
export type VerificationState = z.infer<typeof VerificationStateSchema>;

export const VerificationTargetsSchema = z.object({
  email: z.string(),
  phone: z.string(),
});
export type VerificationTargets = z.infer<typeof VerificationTargetsSchema>;

export const VerificationPublicChannelStateSchema = z.object({
  target: z.string(),
  verified: z.boolean(),
  verifiedAt: z.string().nullable(),
  codeSentAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  attempts: z.number(),
});
export type VerificationPublicChannelState = z.infer<typeof VerificationPublicChannelStateSchema>;

export const VerificationPublicStateSchema = z.object({
  email: VerificationPublicChannelStateSchema,
  phone: VerificationPublicChannelStateSchema,
});
export type VerificationPublicState = z.infer<typeof VerificationPublicStateSchema>;
