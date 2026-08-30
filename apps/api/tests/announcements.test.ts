import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AnnouncementDraftState } from "@sigillus/contracts";
import { buildInitialState } from "@sigillus/domain";
import { adminActivityLogs, professionalProfiles } from "../src/db/schema";
import { createAnnouncementsService } from "../src/modules/announcements";
import { createTestHarness } from "./helpers/app";
import { signUp } from "./helpers/auth";

const harness = createTestHarness();

function service() {
  return createAnnouncementsService({
    db: harness.db,
    profiles: harness.deps.services.profiles,
    logger: harness.deps.logger,
  });
}

function emptyDraft(): AnnouncementDraftState {
  return buildInitialState({
    slug: "x",
    displayName: "X",
    artisticName: "X",
    city: "",
    state: "",
    startingPrice: 0,
    images: [],
    rating: 0,
    reviewsCount: 0,
    profileViews: 0,
    status: "livre",
  });
}

function completeDraft(): AnnouncementDraftState {
  const draft = emptyDraft();
  return {
    ...draft,
    shortDescription: "Curta e direta",
    description: "Descrição longa o bastante para o anúncio.",
    characteristics: {
      ...draft.characteristics,
      gender: "Mulher",
      ethnicity: "Morena",
      height: "170",
      weight: "60",
      hairColor: "Liso::Castanho",
      smoker: "Não",
    },
    services: draft.services.map((item, index) => ({ ...item, selected: index < 2 })),
    pricing: [
      { label: "1 hora", price: "35000", disabled: false, billingType: "hourly" },
      { label: "30 min", price: "20000", disabled: false, billingType: "hourly" },
    ],
    paymentMethods: ["pix"],
    locationState: "SP",
    locationCity: "Sao Paulo",
    locationAddresses: [
      {
        id: "addr-1",
        label: "Jardins",
        addressLine: "Jardins",
        city: "Sao Paulo",
        state: "SP",
        country: "Brasil",
        notes: "",
        active: true,
      },
    ],
  };
}

async function professional(email: string, name = "Pro Teste") {
  const user = await signUp(harness, { email, role: "profissional", name });
  return { id: user.userId, name };
}

async function profileOf(userId: string) {
  const [row] = await harness.db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.userId, userId));
  return row!;
}

describe("announcements", () => {
  it("getMine cria perfil vazio pausado em análise com slug único", async () => {
    const owner = await professional("pro-a@test.dev", "Ana Clara");
    const svc = service();
    const result = await svc.getMine(owner);
    expect(result.ad?.slug).toMatch(/^ana-clara-[0-9a-f]{6}$/);
    expect(result.ad?.verificationStatus).toBe("pending_review");
    expect(result.listingStatus).toBe("Pausado");
    expect(result.draft).toBeNull();
    expect(result.score).toBeNull();
    expect(result.tips).toEqual([]);
    const again = await svc.getMine(owner);
    expect(again.ad?.id).toBe(result.ad?.id);
  });

  it("cada profissional só enxerga e edita o próprio perfil", async () => {
    const a = await professional("pro-a@test.dev", "Ana");
    const b = await professional("pro-b@test.dev", "Bia");
    const svc = service();
    await svc.getMine(a);
    await svc.getMine(b);
    await svc.setContact(a, { whatsappNumber: "11999998888", telegramUsername: null });
    await svc.setAvailability(b, "indisponivel");
    const profileA = await profileOf(a.id);
    const profileB = await profileOf(b.id);
    expect(profileA.whatsappNumber).toBe("11999998888");
    expect(profileB.whatsappNumber).toBeNull();
    expect(profileB.availabilityStatus).toBe("indisponivel");
    expect(profileA.availabilityStatus).toBe("livre");
    const mineB = await svc.getMine(b);
    expect(mineB.ad?.id).toBe(profileB.id);
    expect(mineB.ad?.whatsappNumber).toBeUndefined();
  });

  it("saveDraft grava rascunho e devolve savedAt; getMine calcula score e dicas", async () => {
    const owner = await professional("pro-a@test.dev");
    const svc = service();
    const draft = completeDraft();
    const saved = await svc.saveDraft(owner, draft);
    expect(new Date(saved.savedAt).getTime()).toBeGreaterThan(0);
    const mine = await svc.getMine(owner);
    expect(mine.draft?.shortDescription).toBe("Curta e direta");
    expect(mine.score?.percentage).toBeGreaterThan(0);
    expect(mine.tips.some((tip) => tip.id === "photos")).toBe(true);
    const profile = await profileOf(owner.id);
    expect(profile.shortDescription).toBe("");
  });

  it("saveSection devolve falha de validação sem gravar", async () => {
    const owner = await professional("pro-a@test.dev");
    const svc = service();
    const result = await svc.saveSection(owner, "characteristics", emptyDraft());
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === "characteristics") {
      expect(result.missing).toContain("gender");
    }
    const pricing = await svc.saveSection(owner, "pricing", {
      ...completeDraft(),
      paymentMethods: [],
    });
    expect(pricing).toMatchObject({ ok: false, reason: "pricing" });
    const profile = await profileOf(owner.id);
    expect(profile.draft).toBeNull();
  });

  it("saveSection aplica a seção ao perfil", async () => {
    const owner = await professional("pro-a@test.dev");
    const svc = service();
    const draft = completeDraft();
    const characteristics = await svc.saveSection(owner, "characteristics", draft);
    expect(characteristics).toEqual({ ok: true, saveResult: "saved" });
    let profile = await profileOf(owner.id);
    expect(profile.hairType).toBe("Liso");
    expect(profile.hairColor).toBe("Castanho");
    expect(profile.heightCm).toBe(170);
    expect(profile.weightKg).toBe(60);
    expect(profile.category).toBe("Feminino");
    expect(profile.ethnicity).toBe("Morena");
    expect(profile.startingPrice).toBe(0);

    await svc.saveSection(owner, "pricing", draft);
    await svc.saveSection(owner, "location", draft);
    await svc.saveSection(owner, "services", draft);
    await svc.saveSection(owner, "description", draft);
    profile = await profileOf(owner.id);
    expect(profile.startingPrice).toBe(200);
    expect(profile.pricingTable).toEqual([
      { label: "1 hora", price: 350 },
      { label: "30 min", price: 200 },
    ]);
    expect(profile.paymentMethods).toEqual(["pix"]);
    expect(profile.city).toBe("Sao Paulo");
    expect(profile.state).toBe("SP");
    expect(profile.neighborhood).toBe("Jardins");
    expect(profile.services).toHaveLength(2);
    expect(profile.shortDescription).toBe("Curta e direta");
    expect(profile.draft?.locationCity).toBe("Sao Paulo");
  });

  it("publish bloqueia com pendências obrigatórias", async () => {
    const owner = await professional("pro-a@test.dev");
    const svc = service();
    const result = await svc.publish(owner, emptyDraft());
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === "blocked") {
      expect(result.items.map((item) => item.section)).toEqual(
        expect.arrayContaining(["characteristics", "location"]),
      );
      expect(result.items.every((item) => item.kind === "required")).toBe(true);
    }
    const profile = await profileOf(owner.id);
    expect(profile.listingStatus).toBe("Pausado");
    expect(profile.submittedAt).toBeNull();
  });

  it("publish ok aplica tudo, ativa, submete à moderação e registra atividade", async () => {
    const owner = await professional("pro-a@test.dev", "Carla");
    const svc = service();
    const result = await svc.publish(owner, completeDraft());
    expect(result).toEqual({ ok: true });
    const profile = await profileOf(owner.id);
    expect(profile.listingStatus).toBe("Ativo");
    expect(profile.verificationStatus).toBe("pending_review");
    expect(profile.submittedAt).not.toBeNull();
    expect(profile.city).toBe("Sao Paulo");
    expect(profile.startingPrice).toBe(200);
    expect(profile.hairColor).toBe("Castanho");
    const logs = await harness.db.select().from(adminActivityLogs);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: "profile_submitted",
      targetId: profile.id,
      targetName: "Carla",
    });
  });

  it("publish de perfil já publicado só reativa a listagem", async () => {
    const owner = await professional("pro-a@test.dev");
    const svc = service();
    await svc.getMine(owner);
    const before = await profileOf(owner.id);
    await harness.db
      .update(professionalProfiles)
      .set({ verificationStatus: "published", listingStatus: "Pausado", submittedAt: null })
      .where(eq(professionalProfiles.id, before.id));
    const result = await svc.publish(owner, completeDraft());
    expect(result).toEqual({ ok: true });
    const profile = await profileOf(owner.id);
    expect(profile.verificationStatus).toBe("published");
    expect(profile.listingStatus).toBe("Ativo");
    expect(profile.submittedAt).toBeNull();
    const logs = await harness.db.select().from(adminActivityLogs);
    expect(logs).toHaveLength(0);
  });

  it("setListingStatus alterna Ativo/Pausado", async () => {
    const owner = await professional("pro-a@test.dev");
    const svc = service();
    await svc.setListingStatus(owner, "Ativo");
    expect((await profileOf(owner.id)).listingStatus).toBe("Ativo");
    await svc.setListingStatus(owner, "Pausado");
    expect((await profileOf(owner.id)).listingStatus).toBe("Pausado");
  });
});
