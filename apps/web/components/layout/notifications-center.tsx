"use client";

import type { AccountNotificationItem } from "@/lib/account-notifications";
import { cn } from "@/lib/utils";

interface NotificationsCenterProps {
  unreadItems: AccountNotificationItem[];
  readItems: AccountNotificationItem[];
  onClose: () => void;
  onSelect: (notification: AccountNotificationItem) => void;
  onMarkAllAsRead: () => void;
}

function NotificationRow({
  notification,
  onSelect,
}: {
  notification: AccountNotificationItem;
  onSelect: (notification: AccountNotificationItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition",
        notification.read
          ? "border-zinc-100 bg-white hover:bg-zinc-50"
          : "border-wine-100 bg-wine-50/70 hover:bg-wine-50",
      )}
    >
      <span
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          notification.read ? "bg-zinc-300" : "bg-wine-700",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className={cn("font-semibold", notification.read ? "text-zinc-700" : "text-zinc-900")}>
            {notification.title}
          </p>
          <span className="shrink-0 text-xs text-zinc-500">{notification.time}</span>
        </div>
        <p className="mt-1 text-sm text-zinc-600">{notification.message}</p>
      </div>
    </button>
  );
}

function NotificationSection({
  title,
  items,
  emptyLabel,
  onSelect,
}: {
  title: string;
  items: AccountNotificationItem[];
  emptyLabel: string;
  onSelect: (notification: AccountNotificationItem) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{title}</h3>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function NotificationsCenter({
  unreadItems,
  readItems,
  onClose,
  onSelect,
  onMarkAllAsRead,
}: NotificationsCenterProps) {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-60 bg-black/30"
        onClick={onClose}
        aria-label="Fechar painel de notificações"
      />
      <aside className="fixed right-0 top-0 z-[70] flex h-screen w-full max-w-sm flex-col overflow-hidden border-l border-zinc-200 bg-white shadow-2xl shadow-zinc-900/20 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Central de notificações
            </p>
            <p className="mt-1 text-sm text-zinc-700">Avisos recentes da sua conta</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            Fechar
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <NotificationSection
            title="Não lidas"
            items={unreadItems}
            emptyLabel="Nenhuma notificação não lida"
            onSelect={onSelect}
          />
          <div className="h-px bg-zinc-100" />
          <NotificationSection
            title="Lidas"
            items={readItems}
            emptyLabel="Nenhuma notificação lida"
            onSelect={onSelect}
          />
        </div>

        <div className="border-t border-zinc-100 px-4 py-3">
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={unreadItems.length === 0}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Marcar tudo como lido
          </button>
        </div>
      </aside>
    </>
  );
}
