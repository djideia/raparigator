import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "@sigillus/contracts";
import { getApiUrl } from "@/lib/data-source";

export type ApiClient = ContractRouterClient<typeof contract>;

let cached: ApiClient | null = null;

export function createApiClient(
  options: { baseUrl?: string; headers?: Record<string, string> } = {},
): ApiClient {
  const link = new RPCLink({
    url: `${options.baseUrl ?? getApiUrl()}/rpc`,
    headers: () => options.headers ?? {},
    fetch: (request, init) => globalThis.fetch(request, { ...init, credentials: "include" }),
  });
  return createORPCClient(link);
}

export function getApiClient(): ApiClient {
  if (!cached) {
    cached = createApiClient();
  }
  return cached;
}
