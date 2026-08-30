import { describe, expect, it } from "vitest";
import {
  formatCpf,
  formatPhone,
  getProfileFieldErrors,
  validateCpf,
  validateEmailPair,
  validatePasswordPair,
  validatePhone,
} from "../src/identity";

describe("identidade", () => {
  it("formata e valida CPF por comprimento", () => {
    expect(formatCpf("12345678900")).toBe("123.456.789-00");
    expect(validateCpf("123.456.789-00")).toBeNull();
    expect(validateCpf("123")).toBe("Informe um CPF válido.");
  });

  it("formata telefone internacional e aceita DDI 55", () => {
    expect(formatPhone("5511999998888")).toBe("+55 (11) 99999-8888");
    expect(validatePhone("+55 (11) 99999-8888")).toBeNull();
    expect(validatePhone("11 9999")).toBe("Informe um telefone válido com DDD.");
  });

  it("pares de e-mail e senha precisam bater", () => {
    expect(validateEmailPair("a@b.co", "a@b.co")).toEqual({});
    expect(validateEmailPair("a@b.co", "x@b.co").email).toBe("Os e-mails devem ser iguais.");
    expect(validatePasswordPair("12345678", "12345678")).toEqual({});
    expect(validatePasswordPair("1234567", "1234567").password).toBe(
      "A senha deve ter ao menos 8 caracteres.",
    );
  });

  it("cliente precisa de cidade e preferência; profissional não", () => {
    const form = {
      fullName: "Ana",
      cpf: "12345678900",
      email: "a@b.co",
      confirmEmail: "a@b.co",
      phone: "11999998888",
      city: "",
      preference: "",
    };
    expect(Object.keys(getProfileFieldErrors("cliente", form))).toEqual(["city", "preference"]);
    expect(getProfileFieldErrors("profissional", form)).toEqual({});
  });
});
