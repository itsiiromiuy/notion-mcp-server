// Simple test script to verify Notion integration
import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync } from "fs";

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, ".env");

if (existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log("No .env file found, using environment variables if available");
  dotenv.config();
}

// Configuration
const config = {
  notion: {
    token: process.env.NOTION_API_TOKEN,
    databaseId: process.env.NOTION_DATABASE_ID || "",
  },
};

// Validate config
function validateConfig() {
  const { notion } = config;
  const issues = [];

  if (!notion.token) {
    issues.push("NOTION_API_TOKEN environment variable is not set");
  }

  if (!notion.databaseId) {
    issues.push("NOTION_DATABASE_ID environment variable is not set");
  } else if (
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

// Helper function to generate a title from a question
function generateTitle(question) {
  // Remove question marks and trim
  const cleaned = question.replace(/\?+$/, "").trim();

  // If short enough, use as is
  if (cleaned.length <= 80) {
    return cleaned;
  }

  // Otherwise, truncate and add ellipsis
  return cleaned.substring(0, 77) + "...";
}

async function main() {
  // Validate the configuration first
  const validation = validateConfig();
  if (!validation.valid) {
    console.error("❌ Configuration validation failed:");
    validation.issues.forEach((issue) => console.error(`   - ${issue}`));
    process.exit(1);
  }

  // Initialize Notion client
  const notion = new Client({ auth: config.notion.token });
  const databaseId = config.notion.databaseId;

  console.log(`Testing connection to Notion database: ${databaseId}`);

  try {
    // First verify database access
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    console.log(`✅ Successfully connected to database`);

    // Test creating a page
    const question = "MCP server 是怎麼工作的？";
    const answer =
      "MCP Server是一個基於Model Context Protocol協議的服務器，它允許AI模型與外部工具和服務進行交互。它接收來自AI的請求，處理這些請求，調用相應的外部服務，然後將結果返回給AI模型。";
    const category = "Server Architecture";
    const tags = ["MCP", "Server", "Architecture"];
    const codeRelated = false;
    const solutionType = "Concept";
    const summary = "解釋MCP Server的基本工作原理";

    console.log("Creating new entry in Notion database...");

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [{ text: { content: generateTitle(question) } }],
        },
        Category: {
          select: { name: category },
        },
        Summary: {
          rich_text: [
            {
              text: {
                content: summary || question.substring(0, 100) + "...",
              },
            },
          ],
        },
        Tags: {
          multi_select: tags.map((tag) => ({ name: tag.toLowerCase() })),
        },
        "Code Related": {
          checkbox: codeRelated,
        },
        "Solution Type": {
          select: { name: solutionType },
        },
        Date: {
          date: { start: new Date().toISOString().split("T")[0] },
        },
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ text: { content: "Question" } }],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ text: { content: question } }],
          },
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ text: { content: "Answer" } }],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ text: { content: answer } }],
          },
        },
      ],
    });

    console.log("✅ Successfully created new entry in Notion database");
    console.log(`Page ID: ${response.id}`);
    console.log(`URL: https://notion.so/${response.id.replace(/-/g, "")}`);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

// Run the main function
main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
