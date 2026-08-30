import { describe, expect, it } from "vitest";
import { createNotificationsService } from "../src/modules/notifications";
import { createTestHarness } from "./helpers/app";
import { signUp } from "./helpers/auth";

const harness = createTestHarness();

function service() {
  return createNotificationsService({ db: harness.db });
}

describe("notifications", () => {
  it("push cria, lista em ordem decrescente e marca como lida", async () => {
    const user = await signUp(harness, { email: "notif-a@sigillus.dev" });
    const notifications = service();
    await notifications.push(user.userId, { key: "a", title: "A", message: "primeira" });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await notifications.push(user.userId, {
      key: "b",
      title: "B",
      message: "segunda",
      href: "/x",
    });

    const list = await notifications.list(user.userId);
    expect(list.map((item) => item.title)).toEqual(["B", "A"]);
    expect(list[0]!.href).toBe("/x");
    expect(list.every((item) => !item.read)).toBe(true);
    expect(Number.isNaN(Date.parse(list[0]!.time))).toBe(false);

    await notifications.markRead(user.userId, list[1]!.id);
    const afterOne = await notifications.list(user.userId);
    expect(afterOne.find((item) => item.title === "A")!.read).toBe(true);
    expect(afterOne.find((item) => item.title === "B")!.read).toBe(false);

    await notifications.markAllRead(user.userId);
    const afterAll = await notifications.list(user.userId);
    expect(afterAll.every((item) => item.read)).toBe(true);
  });

  it("push com a mesma chave faz upsert e reabre como não lida", async () => {
    const user = await signUp(harness, { email: "notif-b@sigillus.dev" });
    const notifications = service();
    const first = await notifications.push(user.userId, {
      key: "same",
      title: "Antiga",
      message: "v1",
    });
    await notifications.markRead(user.userId, first.id);
    const second = await notifications.push(user.userId, {
      key: "same",
      title: "Nova",
      message: "v2",
    });
    expect(second.id).toBe(first.id);
    const list = await notifications.list(user.userId);
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe("Nova");
    expect(list[0]!.read).toBe(false);

    await notifications.removeByKey(user.userId, "same");
    expect(await notifications.list(user.userId)).toHaveLength(0);
  });

  it("não deixa mexer em notificação de outro usuário", async () => {
    const owner = await signUp(harness, { email: "notif-owner@sigillus.dev" });
    const intruder = await signUp(harness, { email: "notif-intruder@sigillus.dev" });
    const notifications = service();
    const item = await notifications.push(owner.userId, { key: "k", title: "T", message: "M" });

    await expect(notifications.markRead(intruder.userId, item.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(notifications.remove(intruder.userId, item.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(await notifications.list(intruder.userId)).toHaveLength(0);

    await notifications.remove(owner.userId, item.id);
    expect(await notifications.list(owner.userId)).toHaveLength(0);
  });
});
