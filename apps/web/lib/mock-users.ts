import type { AdminUser, AuthRole, MockUser } from "@/lib/types";

export const mockUsers: MockUser[] = [
  {
    id: "cliente-sigillus",
    role: "cliente",
    fullName: "Cliente Sigillus",
    email: "cliente@sigillus.dev",
    password: "Cliente@123",
    label: "Perfil Cliente",
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
    label: "Perfil Profissional",
    phone: "(11) 98888-7777",
    cpf: "987.654.321-00",
    alias: "Profissional",
    plan: "standard",
  },
];

export function getMockUserByRole(role: Exclude<AuthRole, "visitor">) {
  return mockUsers.find((user) => user.role === role) ?? mockUsers[0];
}

export const adminUsers: AdminUser[] = [
  {
    id: "admin-sigillus",
    role: "admin",
    fullName: "Administrador Sigillus",
    email: "admin@sigillus.dev",
    password: "Admin@123",
  },
];

export function getMockAdminByEmail(email: string): AdminUser | null {
  return adminUsers.find((u) => u.email === email) ?? null;
}
