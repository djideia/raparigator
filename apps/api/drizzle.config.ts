import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://sigillus:sigillus@localhost:5432/sigillus",
  },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
