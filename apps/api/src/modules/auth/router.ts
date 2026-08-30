import { eq } from "drizzle-orm";
import type { User } from "@sigillus/contracts";
import { professionalProfiles } from "../../db/schema";
import { os } from "../../orpc/base";
import { getUserSession, type AppContext } from "../../orpc/context";

export async function resolveSessionUser(context: AppContext): Promise<User | null> {
  const session = await getUserSession(context);
  if (!session) {
    return null;
  }
  const raw = session.user as Record<string, unknown>;
  const role = (raw.role as User["role"] | undefined) ?? "cliente";
  const user: User = {
    id: session.user.id,
    role,
    fullName: session.user.name,
    email: session.user.email,
    phone: (raw.phone as string | undefined) ?? undefined,
    cpf: (raw.cpf as string | undefined) ?? undefined,
    alias: (raw.alias as string | undefined) ?? undefined,
    city: (raw.city as string | undefined) ?? undefined,
  };
  if (role === "profissional") {
    const [profile] = await context.deps.db
      .select({ adTier: professionalProfiles.adTier })
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, session.user.id))
      .limit(1);
    user.plan = profile?.adTier === "premium" ? "premium" : "standard";
  }
  return user;
}

export const authRouter = {
  me: os.auth.me.handler(async ({ context }) => ({ user: await resolveSessionUser(context) })),
};
