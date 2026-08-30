import { createHash, randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import type {
  VerificationChannel,
  VerificationPublicChannelState,
  VerificationPublicState,
} from "@sigillus/contracts";
import type { AppConfig } from "../../config";
import type { Database } from "../../db/client";
import { users, verificationChannels } from "../../db/schema";
import { newId } from "../../lib/ids";
import type { Logger } from "../../lib/logger";

export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
export const VERIFICATION_MAX_ATTEMPTS = 5;

export interface VerificationNotifier {
  sendCode(channel: VerificationChannel, target: string, code: string): Promise<void>;
}

export type VerificationServiceDeps = {
  db: Database;
  config: AppConfig;
  logger: Logger;
  notifier?: VerificationNotifier;
};

export type VerificationService = ReturnType<typeof createVerificationService>;

export type VerificationUser = { id: string; email: string; phone: string | null };

type ChannelRow = typeof verificationChannels.$inferSelect;

const EXPIRED_MESSAGE = "O código expirou. Envie outro para continuar.";
const INVALID_MESSAGE = "Código inválido. Verifique e tente novamente.";

function normalizeTarget(value: string) {
  return value.trim().toLowerCase();
}

function targetFor(user: VerificationUser, channel: VerificationChannel): string {
  return channel === "email" ? user.email : (user.phone ?? "");
}

function hashCode(userId: string, channel: VerificationChannel, code: string): string {
  return createHash("sha256").update(`${userId}:${channel}:${code}`).digest("hex");
}

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function emptyChannelState(target: string): VerificationPublicChannelState {
  return {
    target,
    verified: false,
    verifiedAt: null,
    codeSentAt: null,
    expiresAt: null,
    attempts: 0,
  };
}

function toPublicChannelState(
  row: ChannelRow | null,
  target: string,
  now: Date,
): VerificationPublicChannelState {
  if (!row || normalizeTarget(row.target) !== normalizeTarget(target)) {
    return emptyChannelState(target);
  }
  const codeAlive = Boolean(
    row.codeHash && row.expiresAt && row.expiresAt.getTime() > now.getTime(),
  );
  return {
    target,
    verified: row.verifiedAt !== null,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    codeSentAt: codeAlive ? (row.codeSentAt?.toISOString() ?? null) : null,
    expiresAt: codeAlive ? (row.expiresAt?.toISOString() ?? null) : null,
    attempts: row.attempts,
  };
}

export function createLoggingVerificationNotifier(logger: Logger): VerificationNotifier {
  return {
    async sendCode(channel) {
      logger.info({ channel }, "código de verificação enviado");
    },
  };
}

export function createVerificationService(deps: VerificationServiceDeps) {
  const { db, config, logger } = deps;
  const notifier = deps.notifier ?? createLoggingVerificationNotifier(logger);

  async function findRow(userId: string, channel: VerificationChannel): Promise<ChannelRow | null> {
    const [row] = await db
      .select()
      .from(verificationChannels)
      .where(
        and(eq(verificationChannels.userId, userId), eq(verificationChannels.channel, channel)),
      )
      .limit(1);
    return row ?? null;
  }

  async function clearCode(id: string, attempts?: number) {
    await db
      .update(verificationChannels)
      .set({
        codeHash: null,
        codeSentAt: null,
        expiresAt: null,
        ...(attempts === undefined ? {} : { attempts }),
        updatedAt: new Date(),
      })
      .where(eq(verificationChannels.id, id));
  }

  return {
    async getState(user: VerificationUser): Promise<VerificationPublicState> {
      const now = new Date();
      const rows = await db
        .select()
        .from(verificationChannels)
        .where(eq(verificationChannels.userId, user.id));
      const byChannel = new Map(rows.map((row) => [row.channel, row]));
      return {
        email: toPublicChannelState(byChannel.get("email") ?? null, targetFor(user, "email"), now),
        phone: toPublicChannelState(byChannel.get("phone") ?? null, targetFor(user, "phone"), now),
      };
    },

    async sendCode(
      user: VerificationUser,
      channel: VerificationChannel,
    ): Promise<{ expiresAt: string; devCode: string | null }> {
      const target = targetFor(user, channel);
      if (!target) {
        throw new ORPCError("CONFLICT", {
          message:
            channel === "email"
              ? "Cadastre um e-mail antes de verificar."
              : "Cadastre um telefone antes de verificar.",
        });
      }
      const now = new Date();
      const expiresAt = new Date(now.getTime() + VERIFICATION_CODE_TTL_MS);
      const code = generateCode();
      const values = {
        target,
        codeHash: hashCode(user.id, channel, code),
        codeSentAt: now,
        expiresAt,
        attempts: 0,
        verifiedAt: null,
        updatedAt: now,
      };
      await db
        .insert(verificationChannels)
        .values({ id: newId(), userId: user.id, channel, ...values })
        .onConflictDoUpdate({
          target: [verificationChannels.userId, verificationChannels.channel],
          set: values,
        });
      await notifier.sendCode(channel, target, code);
      logger.info({ userId: user.id, channel }, "código de verificação gerado");
      return {
        expiresAt: expiresAt.toISOString(),
        devCode: config.VERIFICATION_DEV_CODES ? code : null,
      };
    },

    async confirmCode(
      user: VerificationUser,
      channel: VerificationChannel,
      code: string,
    ): Promise<{ success: boolean; message: string }> {
      const now = new Date();
      const target = targetFor(user, channel);
      const row = await findRow(user.id, channel);
      const targetMatches = row ? normalizeTarget(row.target) === normalizeTarget(target) : false;
      const alive = Boolean(
        row &&
        targetMatches &&
        row.codeHash &&
        row.expiresAt &&
        row.expiresAt.getTime() > now.getTime(),
      );
      if (!row || !alive) {
        if (row) {
          await clearCode(row.id);
        }
        return { success: false, message: EXPIRED_MESSAGE };
      }
      if (row.codeHash !== hashCode(user.id, channel, code)) {
        const attempts = row.attempts + 1;
        if (attempts >= VERIFICATION_MAX_ATTEMPTS) {
          await clearCode(row.id, attempts);
        } else {
          await db
            .update(verificationChannels)
            .set({ attempts, updatedAt: now })
            .where(eq(verificationChannels.id, row.id));
        }
        return { success: false, message: INVALID_MESSAGE };
      }
      await db.transaction(async (tx) => {
        await tx
          .update(verificationChannels)
          .set({
            verifiedAt: now,
            codeHash: null,
            codeSentAt: null,
            expiresAt: null,
            updatedAt: now,
          })
          .where(eq(verificationChannels.id, row.id));
        await tx
          .update(users)
          .set(
            channel === "email"
              ? { emailVerified: true, updatedAt: now }
              : { phoneVerified: true, updatedAt: now },
          )
          .where(eq(users.id, user.id));
      });
      logger.info({ userId: user.id, channel }, "canal verificado");
      return {
        success: true,
        message:
          channel === "email" ? "E-mail validado com sucesso." : "Telefone validado com sucesso.",
      };
    },
  };
}
