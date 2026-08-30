import { os } from "../../orpc/base";

export const catalogsRouter = {
  get: os.catalogs.get.handler(({ context }) => context.deps.services.catalogs.get()),
};
