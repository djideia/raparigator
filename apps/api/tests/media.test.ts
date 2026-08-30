import { eq } from "drizzle-orm";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MEDIA_MAX_IMAGE_BYTES } from "@sigillus/contracts";
import { professionalProfiles } from "../src/db/schema";
import { createAnnouncementsService } from "../src/modules/announcements";
import { createMediaService, registerMediaJobs } from "../src/modules/media";
import { createTestHarness } from "./helpers/app";
import { signUp } from "./helpers/auth";

const harness = createTestHarness();

function mediaService() {
  return createMediaService({
    db: harness.db,
    profiles: harness.deps.services.profiles,
    storage: harness.storage,
    jobs: harness.jobs,
    logger: harness.deps.logger,
  });
}

async function professionalWithProfile(email: string, tier: "normal" | "premium" = "normal") {
  const user = await signUp(harness, { email, role: "profissional", name: "Pro Mídia" });
  const announcements = createAnnouncementsService({
    db: harness.db,
    profiles: harness.deps.services.profiles,
    logger: harness.deps.logger,
  });
  const mine = await announcements.getMine({ id: user.userId, name: "Pro Mídia" });
  const profileId = mine.ad!.id;
  if (tier === "premium") {
    await harness.db
      .update(professionalProfiles)
      .set({ adTier: "premium" })
      .where(eq(professionalProfiles.id, profileId));
  }
  return { userId: user.userId, profileId };
}

async function pngBuffer(width = 640, height = 400) {
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 40, b: 90 } },
  })
    .png()
    .toBuffer();
}

async function uploadReadyImage(userId: string, purpose: "gallery" | "profile" | "chat") {
  const svc = mediaService();
  const png = await pngBuffer();
  const created = await svc.createUpload(userId, {
    kind: "image",
    purpose,
    contentType: "image/png",
    sizeBytes: png.byteLength,
  });
  await harness.storage.putObject(
    `media/${userId}/${created.asset.id}.png`,
    new Uint8Array(png),
    "image/png",
  );
  return svc.completeUpload(userId, created.asset.id);
}

async function errorCode(promise: Promise<unknown>) {
  try {
    await promise;
    return null;
  } catch (error) {
    return (error as { code?: string }).code ?? null;
  }
}

describe("media", () => {
  it("createUpload devolve presign e asset pendente com storageKey do dono", async () => {
    const { userId } = await professionalWithProfile("pro@test.dev");
    const svc = mediaService();
    const result = await svc.createUpload(userId, {
      kind: "image",
      purpose: "gallery",
      contentType: "image/jpeg",
      sizeBytes: 1024,
      fileName: "foto.jpg",
    });
    expect(result.method).toBe("PUT");
    expect(result.uploadUrl).toContain(
      encodeURIComponent(`media/${userId}/${result.asset.id}.jpg`),
    );
    expect(result.asset).toMatchObject({
      ownerId: userId,
      kind: "image",
      purpose: "gallery",
      status: "pending_upload",
      url: null,
      position: 0,
    });
    const second = await svc.createUpload(userId, {
      kind: "image",
      purpose: "gallery",
      contentType: "image/jpeg",
      sizeBytes: 1024,
    });
    expect(second.asset.position).toBe(1);
  });

  it("rejeita contentType incompatível com o kind e tamanho acima do limite", async () => {
    const { userId } = await professionalWithProfile("pro@test.dev");
    const svc = mediaService();
    expect(
      await errorCode(
        svc.createUpload(userId, {
          kind: "image",
          purpose: "gallery",
          contentType: "video/mp4",
          sizeBytes: 10,
        }),
      ),
    ).toBe("CONFLICT");
    expect(
      await errorCode(
        svc.createUpload(userId, {
          kind: "image",
          purpose: "gallery",
          contentType: "image/png",
          sizeBytes: MEDIA_MAX_IMAGE_BYTES + 1,
        }),
      ),
    ).toBe("CONFLICT");
  });

  it("aplica limite do plano standard: 10 fotos e 3 vídeos na galeria", async () => {
    const { userId } = await professionalWithProfile("pro@test.dev");
    const svc = mediaService();
    for (let index = 0; index < 10; index += 1) {
      await svc.createUpload(userId, {
        kind: "image",
        purpose: "gallery",
        contentType: "image/png",
        sizeBytes: 10,
      });
    }
    expect(
      await errorCode(
        svc.createUpload(userId, {
          kind: "image",
          purpose: "gallery",
          contentType: "image/png",
          sizeBytes: 10,
        }),
      ),
    ).toBe("PLAN_LIMIT");
    for (let index = 0; index < 3; index += 1) {
      await svc.createUpload(userId, {
        kind: "video",
        purpose: "gallery",
        contentType: "video/mp4",
        sizeBytes: 10,
      });
    }
    expect(
      await errorCode(
        svc.createUpload(userId, {
          kind: "video",
          purpose: "gallery",
          contentType: "video/mp4",
          sizeBytes: 10,
        }),
      ),
    ).toBe("PLAN_LIMIT");
    const chat = await svc.createUpload(userId, {
      kind: "image",
      purpose: "chat",
      contentType: "image/png",
      sizeBytes: 10,
    });
    expect(chat.asset.purpose).toBe("chat");
  });

  it("premium tem limite maior", async () => {
    const { userId } = await professionalWithProfile("pro@test.dev", "premium");
    const svc = mediaService();
    for (let index = 0; index < 11; index += 1) {
      await svc.createUpload(userId, {
        kind: "image",
        purpose: "gallery",
        contentType: "image/png",
        sizeBytes: 10,
      });
    }
    const list = await svc.listMine(userId, "gallery");
    expect(list).toHaveLength(11);
  });

  it("gallery/profile exigem perfil profissional", async () => {
    const client = await signUp(harness, { email: "cliente@test.dev", role: "cliente" });
    const svc = mediaService();
    expect(
      await errorCode(
        svc.createUpload(client.userId, {
          kind: "image",
          purpose: "gallery",
          contentType: "image/png",
          sizeBytes: 10,
        }),
      ),
    ).toBe("FORBIDDEN");
    const chat = await svc.createUpload(client.userId, {
      kind: "image",
      purpose: "chat",
      contentType: "image/png",
      sizeBytes: 10,
    });
    expect(chat.asset.status).toBe("pending_upload");
  });

  it("completeUpload sem objeto no storage devolve CONFLICT", async () => {
    const { userId } = await professionalWithProfile("pro@test.dev");
    const svc = mediaService();
    const created = await svc.createUpload(userId, {
      kind: "image",
      purpose: "gallery",
      contentType: "image/png",
      sizeBytes: 10,
    });
    expect(await errorCode(svc.completeUpload(userId, created.asset.id))).toBe("CONFLICT");
  });

  it("worker gera thumbnail webp, lê dimensões e marca ready", async () => {
    await registerMediaJobs({
      db: harness.db,
      storage: harness.storage,
      jobs: harness.jobs,
      logger: harness.deps.logger,
    });
    const { userId } = await professionalWithProfile("pro@test.dev");
    const asset = await uploadReadyImage(userId, "gallery");
    expect(asset.status).toBe("ready");
    expect(asset.width).toBe(640);
    expect(asset.height).toBe(400);
    expect(asset.url).toBe(`http://storage.test/public/media/${userId}/${asset.id}.png`);
    expect(asset.thumbnailUrl).toBe(
      `http://storage.test/public/media/${userId}/${asset.id}.png.thumb.webp`,
    );
    const thumb = harness.storage.objects.get(`media/${userId}/${asset.id}.png.thumb.webp`);
    expect(thumb?.contentType).toBe("image/webp");
    const meta = await sharp(Buffer.from(thumb!.body)).metadata();
    expect(meta.width).toBe(480);
    expect(harness.jobs.enqueued.slice(-2).map((job) => job.name)).toEqual([
      "media.process",
      "media.moderate",
    ]);
  });

  it("worker marca failed quando a imagem é inválida", async () => {
    await registerMediaJobs({
      db: harness.db,
      storage: harness.storage,
      jobs: harness.jobs,
      logger: harness.deps.logger,
    });
    const { userId } = await professionalWithProfile("pro@test.dev");
    const svc = mediaService();
    const created = await svc.createUpload(userId, {
      kind: "image",
      purpose: "gallery",
      contentType: "image/png",
      sizeBytes: 3,
    });
    await harness.storage.putObject(
      `media/${userId}/${created.asset.id}.png`,
      new Uint8Array([1, 2, 3]),
      "image/png",
    );
    const asset = await svc.completeUpload(userId, created.asset.id);
    expect(asset.status).toBe("failed");
    expect(asset.url).toBeNull();
  });

  it("vídeo fica ready sem thumbnail", async () => {
    await registerMediaJobs({
      db: harness.db,
      storage: harness.storage,
      jobs: harness.jobs,
      logger: harness.deps.logger,
    });
    const { userId } = await professionalWithProfile("pro@test.dev");
    const svc = mediaService();
    const created = await svc.createUpload(userId, {
      kind: "video",
      purpose: "gallery",
      contentType: "video/mp4",
      sizeBytes: 3,
    });
    await harness.storage.putObject(
      `media/${userId}/${created.asset.id}.mp4`,
      new Uint8Array([1, 2, 3]),
      "video/mp4",
    );
    const asset = await svc.completeUpload(userId, created.asset.id);
    expect(asset.status).toBe("ready");
    expect(asset.thumbnailUrl).toBeNull();
    expect(asset.url).toContain(".mp4");
  });

  it("dono só acessa, remove e reordena a própria mídia", async () => {
    await registerMediaJobs({
      db: harness.db,
      storage: harness.storage,
      jobs: harness.jobs,
      logger: harness.deps.logger,
    });
    const a = await professionalWithProfile("pro-a@test.dev");
    const b = await professionalWithProfile("pro-b@test.dev");
    const svc = mediaService();
    const first = await uploadReadyImage(a.userId, "gallery");
    const second = await uploadReadyImage(a.userId, "gallery");

    expect(await errorCode(svc.get(b.userId, first.id))).toBe("FORBIDDEN");
    expect(await errorCode(svc.remove(b.userId, first.id))).toBe("FORBIDDEN");
    expect(await errorCode(svc.reorder(b.userId, [second.id, first.id]))).toBe("FORBIDDEN");
    expect(await errorCode(svc.setProfileImage(b.userId, first.id))).toBe("FORBIDDEN");
    expect(await errorCode(svc.get(a.userId, "nao-existe"))).toBe("NOT_FOUND");
    expect(await svc.listMine(b.userId)).toEqual([]);

    await svc.reorder(a.userId, [second.id, first.id]);
    const ordered = await svc.listMine(a.userId, "gallery");
    expect(ordered.map((item) => item.id)).toEqual([second.id, first.id]);
    expect(ordered.map((item) => item.position)).toEqual([0, 1]);

    await svc.setProfileImage(a.userId, first.id);
    let [profile] = await harness.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.id, a.profileId));
    expect(profile?.profileImageAssetId).toBe(first.id);

    await svc.remove(a.userId, first.id);
    [profile] = await harness.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.id, a.profileId));
    expect(profile?.profileImageAssetId).toBeNull();
    expect(harness.storage.objects.has(`media/${a.userId}/${first.id}.png`)).toBe(false);
    expect(harness.storage.objects.has(`media/${a.userId}/${first.id}.png.thumb.webp`)).toBe(false);
    expect(await svc.listMine(a.userId, "gallery")).toHaveLength(1);

    await svc.setProfileImage(a.userId, null);
    [profile] = await harness.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.id, a.profileId));
    expect(profile?.profileImageAssetId).toBeNull();
  });

  it("setProfileImage recusa asset que não é imagem pronta do próprio perfil", async () => {
    const { userId } = await professionalWithProfile("pro@test.dev");
    const svc = mediaService();
    const pending = await svc.createUpload(userId, {
      kind: "image",
      purpose: "gallery",
      contentType: "image/png",
      sizeBytes: 10,
    });
    expect(await errorCode(svc.setProfileImage(userId, pending.asset.id))).toBe("CONFLICT");
    const chat = await svc.createUpload(userId, {
      kind: "image",
      purpose: "chat",
      contentType: "image/png",
      sizeBytes: 10,
    });
    expect(await errorCode(svc.setProfileImage(userId, chat.asset.id))).toBe("FORBIDDEN");
    expect(await errorCode(svc.reorder(userId, [chat.asset.id]))).toBe("FORBIDDEN");
  });

  it("perfil profissional expõe a galeria pronta via imagesFor", async () => {
    await registerMediaJobs({
      db: harness.db,
      storage: harness.storage,
      jobs: harness.jobs,
      logger: harness.deps.logger,
    });
    const { userId, profileId } = await professionalWithProfile("pro@test.dev");
    const asset = await uploadReadyImage(userId, "gallery");
    const svc = mediaService();
    await svc.setProfileImage(userId, asset.id);
    const [row] = await harness.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.id, profileId));
    const images = await harness.deps.services.profiles.imagesFor([row!]);
    expect(images.get(profileId)).toEqual({
      images: [asset.url],
      profileImage: asset.url,
      profileImageIndex: 0,
    });
  });
});
