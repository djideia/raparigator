import { ORPCError } from "@orpc/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { AccountNotificationItem } from "@sigillus/contracts";
import type { Database } from "../../db/client";
import { notifications } from "../../db/schema";
import { newId } from "../../lib/ids";

export type NotificationsService = ReturnType<typeof createNotificationsService>;

export type NotificationPush = {
  key: string;
  title: string;
  message: string;
  href?: string;
};

type NotificationRow = typeof notifications.$inferSelect;

function toItem(row: NotificationRow): AccountNotificationItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    time: row.createdAt.toISOString(),
    read: row.readAt !== null,
    href: row.href ?? undefined,
  };
}

export function createNotificationsService(deps: { db: Database }) {
  const { db } = deps;

  return {
    async list(userId: string): Promise<AccountNotificationItem[]> {
      const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
      return rows.map(toItem);
    },

    async markRead(userId: string, id: string) {
      const updated = await db
        .update(notifications)
        .set({ readAt: sql`coalesce(${notifications.readAt}, now())` })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .returning({ id: notifications.id });
      if (updated.length === 0) {
        throw new ORPCError("NOT_FOUND", { message: "Notificação não encontrada." });
      }
      return { ok: true as const };
    },

    async markAllRead(userId: string) {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
      return { ok: true as const };
    },

    async remove(userId: string, id: string) {
      const deleted = await db
        .delete(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .returning({ id: notifications.id });
      if (deleted.length === 0) {
        throw new ORPCError("NOT_FOUND", { message: "Notificação não encontrada." });
      }
      return { ok: true as const };
    },

    async push(userId: string, input: NotificationPush): Promise<AccountNotificationItem> {
      const now = new Date();
      const values = {
        id: newId(),
        userId,
        key: input.key,
        title: input.title,
        message: input.message,
        href: input.href ?? null,
        readAt: null,
        createdAt: now,
      };
      const [row] = await db
        .insert(notifications)
        .values(values)
        .onConflictDoUpdate({
          target: [notifications.userId, notifications.key],
          set: {
            title: values.title,
            message: values.message,
            href: values.href,
            readAt: null,
            createdAt: now,
          },
        })
        .returning();
      return toItem(row!);
    },

    async removeByKey(userId: string, key: string) {
      await db
        .delete(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.key, key)));
    },
  };
}
