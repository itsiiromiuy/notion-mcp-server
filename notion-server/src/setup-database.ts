import { Client } from "@notionhq/client";
import { config, validateConfig } from "./config.js";
import type {
  CreateDatabaseParameters,
  DatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";

/**
 * Sets up a Notion database for tracking AI/LLM questions and answers
 * This is a utility script to help create the required database structure
 */
async function setupDatabase() {
  console.error("🔧 Setting up Notion Database for AI Question Tracking");

  // Validate configuration
  const validation = validateConfig();
  if (!validation.valid) {
    console.error("❌ Configuration validation failed:");
    validation.issues.forEach((issue) => console.error(`   - ${issue}`));
    process.exit(1);
  }

  if (!process.env.NOTION_PARENT_PAGE_ID) {
    console.error("❌ NOTION_PARENT_PAGE_ID environment variable is not set");
    console.error("   This is required to create a new database");
    process.exit(1);
  }

  const notion = new Client({ auth: config.notion.token });
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID;

  try {
    // Check if database ID is already set in config
    if (config.notion.databaseId) {
      console.error(`📊 Database ID already set: ${config.notion.databaseId}`);
      try {
        // Verify the database exists and is accessible
        const database = (await notion.databases.retrieve({
          database_id: config.notion.databaseId,
        })) as DatabaseObjectResponse;

        console.error(
          `✅ Successfully connected to existing database: "${
            database.title?.[0]?.plain_text || "Untitled"
          }"`
        );
        console.error("   No need to create a new database.");
        return;
      } catch (err) {
        const error = err as Error & { status?: number };
        console.warn(
          `⚠️ Could not access configured database: ${error.message}`
        );
        if (error.status === 404) {
          console.error(
            "   The configured database was not found. Creating a new one..."
          );
        } else {
          console.error("   Will attempt to create a new database...");
        }
      }
    }

    // Create a new database
    console.error(`📝 Creating new database in parent page: ${parentPageId}`);

    const databaseParams: CreateDatabaseParameters = {
      parent: {
        type: "page_id",
        page_id: parentPageId,
      },
      is_inline: true,
      title: [
        {
          type: "text",
          text: {
            content: "🦔 AI Question Tracker",
          },
        },
      ],
      properties: {
        Name: {
          title: {},
        },
        Category: {
          select: {
            options: [
              { name: "JavaScript", color: "blue" },
              { name: "Python", color: "green" },
              { name: "General Programming", color: "orange" },
              { name: "AI/ML", color: "purple" },
              { name: "Web Development", color: "red" },
              { name: "DevOps", color: "gray" },
              { name: "Other", color: "default" },
            ],
          },
        },
        Summary: {
          rich_text: {},
        },
        Tags: {
          multi_select: {
            options: [
              { name: "javascript", color: "blue" },
              { name: "python", color: "green" },
              { name: "algorithm", color: "red" },
              { name: "data structure", color: "orange" },
              { name: "frontend", color: "yellow" },
              { name: "backend", color: "gray" },
              { name: "machine learning", color: "purple" },
              { name: "llm", color: "pink" },
            ],
          },
        },
        Mastered: {
          checkbox: {},
        },
        "Solution Type": {
          select: {
            options: [
              { name: "Implementation", color: "blue" },
              { name: "Explanation", color: "green" },
              { name: "Debugging", color: "red" },
              { name: "Best Practice", color: "orange" },
              { name: "Performance", color: "yellow" },
            ],
          },
        },
        Date: {
          date: {},
        },
      },
      icon: {
        type: "emoji",
        emoji: "🦔",
      },
      cover: {
        type: "external",
        external: {
          url: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=1436&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        },
      },
    };

    const response = await notion.databases.create(databaseParams);
    console.error(`✅ Successfully created new database!`);
    console.error(`   Database ID: ${response.id}`);

    // Generate URL from ID instead of using response.url which might not be available in types
    const databaseUrl = `https://notion.so/${response.id.replace(/-/g, "")}`;
    console.error(`   Database URL: ${databaseUrl}`);

    console.error("\n⚠️ IMPORTANT: Add this database ID to your .env file:");
    console.error(`NOTION_DATABASE_ID=${response.id}`);
  } catch (err) {
    const error = err as Error & { status?: number };
    console.error(`❌ Failed to set up database: ${error.message}`);
    if (error.status === 404) {
      console.error(
        "   Parent page not found. Check your NOTION_PARENT_PAGE_ID."
      );
    } else if (error.status === 403) {
      console.error(
        "   Permission denied. Make sure your integration has write access to the parent page."
      );
    }
    process.exit(1);
  }
}

// Run the setup function
setupDatabase().catch((err) => {
  const error = err as Error;
  console.error("Unhandled error:", error.message || error);
  process.exit(1);
});
