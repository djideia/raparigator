import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { accounts, adminAccounts, adminUsers, users } from "../schema";
import { newId } from "../../lib/ids";

export type SeedUser = {
  id: string;
  role: "cliente" | "profissional";
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
  alias?: string;
  city?: string;
};

export const DEV_USERS: SeedUser[] = [
  {
    id: "cliente-sigillus",
    role: "cliente",
    fullName: "Cliente Sigillus",
    email: "cliente@sigillus.dev",
    password: "Cliente@123",
    phone: "(11) 99999-8888",
    cpf: "123.456.789-00",
    alias: "Cliente",
    city: "São Paulo, SP",
  },
  {
    id: "profissional-sigillus",
    role: "profissional",
    fullName: "Profissional Sigillus",
    email: "profissional@sigillus.dev",
    password: "Profissional@123",
    phone: "(11) 98888-7777",
    cpf: "987.654.321-00",
    alias: "Profissional",
  },
];

export const DEV_ADMINS = [
  {
    id: "admin-sigillus",
    fullName: "Administrador Sigillus",
    email: "admin@sigillus.dev",
    password: "Admin@123",
  },
];

export async function upsertUserWithPassword(db: Database, user: SeedUser) {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, user.email));
  const userId = existing?.id ?? user.id;
  const password = await hashPassword(user.password);
  await db
    .insert(users)
    .values({
      id: userId,
      name: user.fullName,
      email: user.email,
      emailVerified: true,
      role: user.role,
      cpf: user.cpf ?? null,
      phone: user.phone ?? null,
      alias: user.alias ?? null,
      city: user.city ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { name: user.fullName, role: user.role, updatedAt: new Date() },
    });
  const [account] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.userId, userId));
  if (account) {
    await db
      .update(accounts)
      .set({ password, updatedAt: new Date() })
      .where(eq(accounts.id, account.id));
  } else {
    await db.insert(accounts).values({
      id: newId(),
      accountId: userId,
      providerId: "credential",
      userId,
      password,
    });
  }
  return userId;
}

export async function upsertAdminWithPassword(db: Database, admin: (typeof DEV_ADMINS)[number]) {
  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, admin.email));
  const adminId = existing?.id ?? admin.id;
  const password = await hashPassword(admin.password);
  await db
    .insert(adminUsers)
    .values({ id: adminId, name: admin.fullName, email: admin.email, emailVerified: true })
    .onConflictDoUpdate({
      target: adminUsers.id,
      set: { name: admin.fullName, updatedAt: new Date() },
    });
  const [account] = await db
    .select({ id: adminAccounts.id })
    .from(adminAccounts)
    .where(eq(adminAccounts.userId, adminId));
  if (account) {
    await db
      .update(adminAccounts)
      .set({ password, updatedAt: new Date() })
      .where(eq(adminAccounts.id, account.id));
  } else {
    await db.insert(adminAccounts).values({
      id: newId(),
      accountId: adminId,
      providerId: "credential",
      userId: adminId,
      password,
    });
  }
  return adminId;
}

export async function seedDevUsers(db: Database) {
  for (const user of DEV_USERS) {
    await upsertUserWithPassword(db, user);
  }
  for (const admin of DEV_ADMINS) {
    await upsertAdminWithPassword(db, admin);
  }
}
