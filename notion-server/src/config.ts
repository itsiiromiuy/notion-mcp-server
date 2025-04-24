import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync } from "fs";

// Set up __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootPath = dirname(__dirname);

// Load environment variables from .env file
const envPath = resolve(rootPath, ".env");

if (existsSync(envPath)) {
  process.stderr.write(`📄 Loading environment from ${envPath}\n`);
  dotenv.config({ path: envPath });
} else {
  process.stderr.write(
    "⚠️ No .env file found, using environment variables if available\n"
  );
  dotenv.config();
}

// Configuration object
export const config = {
  notion: {
    token: process.env.NOTION_API_TOKEN,
    databaseId: process.env.NOTION_DATABASE_ID || "",
  },
  server: {
    name: "MCP Server for AI-Notion Integration",
    database: "Developer Learning Journal - AI Question Tracker",
  },
};

// Validate configuration
export function validateConfig() {
  const { notion } = config;

  const issues = [];

  if (!notion.token) {
    issues.push("NOTION_API_TOKEN environment variable is not set");
  }

  if (
    notion.databaseId &&
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      notion.databaseId
    )
  ) {
    issues.push(
      "NOTION_DATABASE_ID is not in valid UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
    );
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
