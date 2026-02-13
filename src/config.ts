import { resolve } from "path";
import { existsSync, readFileSync, statSync, mkdirSync, writeFileSync } from "fs";

export interface XCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  bearerToken?: string;
}

interface ConfigFile {
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  access_token_secret?: string;
  bearer_token?: string;
}

const CONFIG_DIR = resolve(process.env.HOME ?? "~", ".config/twx-cli");
const CONFIG_PATH = resolve(CONFIG_DIR, "config.json");

/**
 * Load credentials from environment variables or config file.
 * Priority: process.env → ~/.config/twx-cli/config.json
 */
export function loadCredentials(): XCredentials {
  let fileConfig: ConfigFile = {};

  if (existsSync(CONFIG_PATH)) {
    // Warn if config file is world-readable
    try {
      const mode = statSync(CONFIG_PATH).mode;
      if (mode & 0o004) {
        console.warn(`⚠ ${CONFIG_PATH} is world-readable. Run: chmod 600 ${CONFIG_PATH}`);
      }
    } catch { /* ignore stat errors */ }

    try {
      fileConfig = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    } catch (err) {
      console.warn(`⚠ Failed to parse ${CONFIG_PATH}: ${(err as Error).message}`);
    }
  }

  const apiKey = process.env.X_API_KEY ?? process.env.TWITTER_API_KEY ?? fileConfig.api_key;
  const apiSecret = process.env.X_API_SECRET ?? process.env.TWITTER_API_SECRET ?? fileConfig.api_secret;
  const accessToken = process.env.X_ACCESS_TOKEN ?? process.env.TWITTER_ACCESS_TOKEN ?? fileConfig.access_token;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET ?? process.env.TWITTER_ACCESS_TOKEN_SECRET ?? fileConfig.access_token_secret;
  const bearerToken = process.env.X_BEARER_TOKEN ?? process.env.TWITTER_BEARER_TOKEN ?? fileConfig.bearer_token;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    const missing: string[] = [];
    if (!apiKey) missing.push("api_key");
    if (!apiSecret) missing.push("api_secret");
    if (!accessToken) missing.push("access_token");
    if (!accessTokenSecret) missing.push("access_token_secret");
    throw new Error(
      `Missing credentials: ${missing.join(", ")}\n` +
      `Set them in ~/.config/twx-cli/config.json or as environment variables.\n` +
      `Run 'twx init' to set up credentials interactively.`
    );
  }

  return { apiKey, apiSecret, accessToken, accessTokenSecret, bearerToken };
}

/** Get config file path */
export function getConfigPath(): string {
  return CONFIG_PATH;
}

/** Save credentials to config file */
export function saveConfig(config: ConfigFile): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
}
