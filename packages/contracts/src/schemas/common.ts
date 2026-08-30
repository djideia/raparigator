import { z } from "zod";

export const AvailabilityStatusSchema = z.enum(["livre", "em_atendimento", "indisponivel"]);
export type AvailabilityStatus = z.infer<typeof AvailabilityStatusSchema>;

export const AdCategorySchema = z.enum(["premium", "normal"]);
export type AdCategory = z.infer<typeof AdCategorySchema>;

export const PlanTierSchema = z.enum(["standard", "premium"]);
export type PlanTier = z.infer<typeof PlanTierSchema>;

export const PremiumBillingCycleSchema = z.enum(["monthly", "semiannual"]);
export type PremiumBillingCycle = z.infer<typeof PremiumBillingCycleSchema>;

export const UserRoleSchema = z.enum(["cliente", "profissional"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const AuthRoleSchema = z.enum(["visitor", "cliente", "profissional"]);
export type AuthRole = z.infer<typeof AuthRoleSchema>;

export const VerificationStatusSchema = z.enum(["pending_review", "published", "rejected"]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const AdminRoleSchema = z.enum(["visitor", "admin"]);
export type AdminRole = z.infer<typeof AdminRoleSchema>;

export const IsoDateTimeSchema = z.string();

export const IdSchema = z.string().min(1);
export const SlugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const PAGE_SIZE_MAX = 100;

export const PaginationInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(PAGE_SIZE_MAX).default(20),
});
export type PaginationInput = z.infer<typeof PaginationInputSchema>;

export function paginated<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(PAGE_SIZE_MAX),
  });
}

export const OkSchema = z.object({ ok: z.literal(true) });
