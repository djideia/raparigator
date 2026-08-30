export type DataSource = "mock" | "api";

export const DEFAULT_API_URL = "http://localhost:4000";

export function getDataSource(): DataSource {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "mock";
}

export function isApiDataSource(): boolean {
  return getDataSource() === "api";
}

export function getApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
}
