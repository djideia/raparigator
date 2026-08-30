import { z } from "zod";

export const AccountNotificationItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  time: z.string(),
  read: z.boolean(),
  href: z.string().optional(),
});
export type AccountNotificationItem = z.infer<typeof AccountNotificationItemSchema>;
