import { z } from "zod";
import { PlanTierSchema, UserRoleSchema } from "./common";

export const UserSchema = z.object({
  id: z.string(),
  role: UserRoleSchema,
  fullName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  alias: z.string().optional(),
  city: z.string().optional(),
  plan: PlanTierSchema.optional(),
});
export type User = z.infer<typeof UserSchema>;

export const AdminUserSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  role: z.literal("admin"),
});
export type AdminUser = z.infer<typeof AdminUserSchema>;

export const AdminReviewActionSchema = z.object({
  profileId: z.string(),
  action: z.enum(["approved", "rejected"]),
  adminId: z.string(),
  reason: z.string().optional(),
  note: z.string().optional(),
  timestamp: z.string(),
});
export type AdminReviewAction = z.infer<typeof AdminReviewActionSchema>;

export const ClientAccountSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  cpf: z.string(),
  city: z.string(),
  state: z.string(),
  registeredAt: z.string(),
  status: z.enum(["active", "suspended"]),
  suspensionReason: z.string().optional(),
  totalContacts: z.number(),
});
export type ClientAccount = z.infer<typeof ClientAccountSchema>;

export const SessionSchema = z.object({
  user: UserSchema.nullable(),
});
export type Session = z.infer<typeof SessionSchema>;

export const AdminSessionSchema = z.object({
  admin: AdminUserSchema.nullable(),
});
export type AdminSession = z.infer<typeof AdminSessionSchema>;
