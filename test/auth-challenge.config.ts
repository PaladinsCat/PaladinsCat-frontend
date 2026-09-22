import { defineConfig } from "@playwright/test";
import base from "./player-name-history.config";

export default defineConfig({ ...base, testMatch: "auth-challenge.spec.ts" });
