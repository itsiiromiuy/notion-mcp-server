import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@notionhq/client";
import { config, validateConfig } from "./config.js";
import type {
  PageObjectResponse,
  CreateDatabaseParameters,
  DatabaseObjectResponse,
  UpdatePageParameters,
  NumberPropertyItemObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import { z } from "zod";
import { promises as fs } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Add the Claude config path constant
const CLAUDE_CONFIG_PATH =
  "/Users/itsyuimoriispace/Library/Application Support/Claude/claude_desktop_config.json";

// Update the config loading function
async function loadConfig() {
  try {
    const configData = await fs.readFile(CLAUDE_CONFIG_PATH, "utf8");
    const claudeConfig = JSON.parse(configData);

    // Get Notion configuration from Claude config
    const notionConfig = claudeConfig.mcpServers?.["notion-server"]?.env || {};

    // Update process.env with values from Claude config
    process.env.NOTION_API_TOKEN =
      notionConfig.NOTION_API_TOKEN || process.env.NOTION_API_TOKEN;
    process.env.NOTION_PARENT_PAGE_ID =
      notionConfig.NOTION_PARENT_PAGE_ID || process.env.NOTION_PARENT_PAGE_ID;
    process.env.NOTION_DATABASE_ID =
      notionConfig.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

    return notionConfig;
  } catch (error) {
    process.stderr.write(`⚠️ Failed to load Claude config: ${error}\n`);
    return {};
  }
}

// Update both config files function
async function updateConfigurations(databaseId: string) {
  // Update .env file
  const envPath = resolve(__dirname, "..", ".env");
  try {
    // Read current .env content
    let envContent = await fs.readFile(envPath, "utf-8");

    // Update or add NOTION_DATABASE_ID
    if (envContent.includes("NOTION_DATABASE_ID=")) {
      envContent = envContent.replace(
        /NOTION_DATABASE_ID=.*/,
        `NOTION_DATABASE_ID=${databaseId}`
      );
    } else {
      envContent += `\nNOTION_DATABASE_ID=${databaseId}\n`;
    }

    // Write back to .env
    await fs.writeFile(envPath, envContent, "utf-8");
    process.stderr.write(
      `✅ Successfully updated .env file with database ID\n`
    );
  } catch (error) {
    process.stderr.write(`⚠️ Failed to update .env file: ${error}\n`);
  }

  // Update Claude Desktop config
  try {
    const configData = await fs.readFile(CLAUDE_CONFIG_PATH, "utf8");
    const config = JSON.parse(configData);

    // Update the notion-server environment
    if (config.mcpServers && config.mcpServers["notion-server"]) {
      config.mcpServers["notion-server"].env = {
        ...config.mcpServers["notion-server"].env,
        NOTION_DATABASE_ID: databaseId,
      };

      // Write back the updated config
      await fs.writeFile(
        CLAUDE_CONFIG_PATH,
        JSON.stringify(config, null, 2),
        "utf8"
      );
      process.stderr.write(
        `✅ Successfully updated Claude Desktop config with database ID\n`
      );
    }
  } catch (error) {
    process.stderr.write(
      `⚠️ Failed to update Claude Desktop config: ${error}\n`
    );
  }

  // Update process.env
  process.env.NOTION_DATABASE_ID = databaseId;
}

function formatPageId(pageId: string): string {
  // Remove any existing hyphens and non-alphanumeric characters
  const cleanId = pageId.replace(/[^a-zA-Z0-9]/g, "");

  // If we have a 32-character string, format it properly
  if (cleanId.length === 32) {
    return `${cleanId.slice(0, 8)}-${cleanId.slice(8, 12)}-${cleanId.slice(
      12,
      16
    )}-${cleanId.slice(16, 20)}-${cleanId.slice(20)}`;
  }

  // If not 32 characters, return as is (might be a different format)
  return pageId;
}

async function initializeDatabase(notion: Client, parentPageId: string) {
  // Format the page ID
  const formattedPageId = formatPageId(parentPageId);

  process.stderr.write(`🔄 Creating database in page: ${formattedPageId}\n`);

  const databaseParams: CreateDatabaseParameters = {
    parent: {
      type: "page_id",
      page_id: formattedPageId,
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
      Summary: {
        rich_text: {},
      },
      Date: {
        date: {},
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
      "Mastery Level": {
        select: {
          options: [
            { name: "⭐ First Encounter", color: "gray" },
            { name: "⭐⭐ Learning", color: "blue" },
            { name: "⭐⭐⭐ Familiar", color: "green" },
            { name: "⭐⭐⭐⭐ Proficient", color: "yellow" },
            { name: "⭐⭐⭐⭐⭐ Mastered", color: "purple" },
          ],
        },
      },
      "Learning Status": {
        select: {
          options: [
            { name: "🆕 New Knowledge", color: "blue" },
            { name: "📅 Review Due", color: "yellow" },
            { name: "📚 Learning", color: "green" },
            { name: "✅ Mastered", color: "purple" },
          ],
        },
      },
      "Last Reviewed": {
        date: {},
      },
      "Next Review": {
        formula: {
          expression: 'dateAdd(prop("Last Reviewed"), 7, "days")',
        },
      },
    },
  };

  try {
    const response = await notion.databases.create(databaseParams);
    process.stderr.write(`✅ Successfully created new database!\n`);
    process.stderr.write(`   Database ID: ${response.id}\n`);

    // Update both configurations
    await updateConfigurations(response.id);

    return response.id;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to create database: ${err.message}`);
  }
}

async function checkAndSetupDatabase(notion: Client): Promise<string> {
  // First check if database ID is configured
  if (config.notion.databaseId) {
    try {
      // Try to access the database
      const database = (await notion.databases.retrieve({
        database_id: config.notion.databaseId,
      })) as DatabaseObjectResponse;

      // Verify this is our AI Question Tracker database
      const title = database.title?.[0]?.plain_text || "";
      if (!title.includes("AI Question Tracker")) {
        process.stderr.write(
          "⚠️ Found database but it's not an AI Question Tracker database\n"
        );
        await updateConfigurations(""); // Clear the database ID
        throw new Error(
          "Database exists but is not an AI Question Tracker database"
        );
      }

      // Database exists and is valid
      process.stderr.write(`✅ Found existing database: "${title}"\n`);
      return config.notion.databaseId;
    } catch (err) {
      const error = err as Error & { status?: number };
      process.stderr.write(
        `⚠️ Could not access configured database: ${error.message}\n`
      );
      // Clear the invalid database ID
      await updateConfigurations("");
      // Continue to creation if database not found
    }
  }

  // If we get here, we need to create a new database
  process.stderr.write(
    "📝 No accessible database found. Starting database setup...\n"
  );

  // Check for parent page ID
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
  if (!parentPageId) {
    throw new Error(
      "NOTION_PARENT_PAGE_ID environment variable is not set. " +
        "Please set this variable to the ID of the Notion page where you want to create the database."
    );
  }

  // Create new database
  return await initializeDatabase(notion, parentPageId);
}

// Update the main function to use loadConfig
async function main() {
  // Load configuration from Claude config file
  await loadConfig();

  // Validate the configuration
  const validation = validateConfig();
  if (!validation.valid) {
    process.stderr.write("❌ Configuration validation failed:\n");
    validation.issues.forEach((issue) =>
      process.stderr.write(`   - ${issue}\n`)
    );
    process.exit(1);
  }

  // Initialize Notion client
  const notion = new Client({ auth: config.notion.token });

  try {
    // Check and setup database if needed
    const databaseId = await checkAndSetupDatabase(notion);

    // Create MCP server instance
    const server = new McpServer({
      name: config.server.name,
      version: "1.0.0",
    });

    // Register tools
    await registerTools(server, notion, databaseId);

    // Connect to transport and log startup message
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Log successful connection
    process.stderr.write("🚀 MCP Server for AI-Notion Integration started!\n");
    process.stderr.write(`🔗 Connected to Notion database: ${databaseId}\n`);
  } catch (err) {
    const error = err as Error;
    process.stderr.write(`❌ Server initialization failed: ${error.message}\n`);
    if (error.message.includes("NOTION_PARENT_PAGE_ID")) {
      process.stderr.write("\nTo set up your database:\n");
      process.stderr.write(
        "1. Go to Notion and copy the ID of the page where you want to create the database\n"
      );
      process.stderr.write("2. Add this line to your .env file:\n");
      process.stderr.write("   NOTION_PARENT_PAGE_ID=your-page-id\n");
      process.stderr.write("3. Restart the server\n");
    }
    process.exit(1);
  }
}

// Define types for tool parameters
interface SaveEntryParams {
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  solutionType?: string;
  summary?: string;
}

interface RedditSearchParams {
  query: string;
  subreddits?: string[];
  timeRange?: string;
  minScore?: number;
  limit?: number;
}

interface QueryDatabaseParams {
  query?: string;
  category?: string;
  tag?: string;
  limit?: number;
}

// Spaced Repetition Types and Constants
interface SpacedRepetitionConfig {
  MASTERY_LEVELS: {
    [key: string]: {
      name: string;
      stars: string;
      days: number;
    };
  };
  LEARNING_STATUS: {
    [key: string]: string;
  };
}

const spacedRepetitionConfig: SpacedRepetitionConfig = {
  MASTERY_LEVELS: {
    INITIAL: { name: "First Encounter", stars: "⭐", days: 1 },
    LEARNING: { name: "Learning", stars: "⭐⭐", days: 2 },
    FAMILIAR: { name: "Familiar", stars: "⭐⭐⭐", days: 4 },
    PROFICIENT: { name: "Proficient", stars: "⭐⭐⭐⭐", days: 7 },
    MASTERED: { name: "Mastered", stars: "⭐⭐⭐⭐⭐", days: 15 },
  },
  LEARNING_STATUS: {
    NEW: "🆕 New Knowledge",
    REVIEW_DUE: "📅 Review Due",
    IN_PROGRESS: "📚 Learning",
    MASTERED: "✅ Mastered",
  },
};

async function registerTools(
  server: McpServer,
  notion: Client,
  databaseId: string
) {
  // Register a tool to setup database
  server.tool(
    "notion_setup_database",
    "Setup a new Notion database for AI Q&A tracking",
    {
      parent_page_id: z
        .string()
        .optional()
        .describe(
          "The ID of the parent page where the database will be created"
        ),
    },
    async (params: { parent_page_id?: string }) => {
      try {
        // Get the parent page ID
        const parentPageId =
          params.parent_page_id || process.env.NOTION_PARENT_PAGE_ID;
        if (!parentPageId) {
          return {
            content: [
              {
                type: "text",
                text: "Please provide a parent page ID where the database should be created.",
              },
            ],
          };
        }

        // First verify the parent page exists and is accessible
        try {
          await notion.pages.retrieve({ page_id: formatPageId(parentPageId) });
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: "Could not access the specified page. Please make sure:\n1. The page ID is correct\n2. You've shared the page with your integration",
              },
            ],
          };
        }

        // Create new database
        process.stderr.write(
          `📝 Creating new database in page: ${parentPageId}\n`
        );
        const databaseParams: CreateDatabaseParameters = {
          parent: {
            type: "page_id",
            page_id: formatPageId(parentPageId),
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
            Summary: {
              rich_text: {},
            },
            Date: {
              date: {},
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
            "Mastery Level": {
              select: {
                options: [
                  { name: "⭐ First Encounter", color: "gray" },
                  { name: "⭐⭐ Learning", color: "blue" },
                  { name: "⭐⭐⭐ Familiar", color: "green" },
                  { name: "⭐⭐⭐⭐ Proficient", color: "yellow" },
                  { name: "⭐⭐⭐⭐⭐ Mastered", color: "purple" },
                ],
              },
            },
            "Learning Status": {
              select: {
                options: [
                  { name: "🆕 New Knowledge", color: "blue" },
                  { name: "📅 Review Due", color: "yellow" },
                  { name: "📚 Learning", color: "green" },
                  { name: "✅ Mastered", color: "purple" },
                ],
              },
            },
            "Last Reviewed": {
              date: {},
            },
            "Next Review": {
              formula: {
                expression: 'dateAdd(prop("Last Reviewed"), 7, "days")',
              },
            },
          },
        };

        const response = await notion.databases.create(databaseParams);

        // Update both configurations
        await updateConfigurations(response.id);

        // Update the databaseId parameter for other tools
        databaseId = response.id;

        return {
          content: [
            {
              type: "text",
              text: `✅ Successfully created new database!\nDatabase ID: ${response.id}`,
            },
          ],
          json: {
            database_id: response.id,
            exists: false,
          },
        };
      } catch (error) {
        const err = error as Error;
        return {
          content: [
            {
              type: "text",
              text: `Failed to create database: ${err.message}`,
            },
          ],
        };
      }
    }
  );

  // Register a tool to save AI question/answer pairs to Notion
  server.tool(
    "notion_ai_save_entry",
    "Save an AI/LLM-related question and answer to your Notion database",
    {
      question: z.string().describe("The question asked by the user"),
      answer: z.string().describe("The answer provided by the AI"),
      category: z
        .string()
        .describe("Category of the question (e.g., JavaScript, Python, AI/ML)"),
      tags: z
        .array(z.string())
        .optional()
        .describe(
          'Tags related to the question (e.g., "javascript", "algorithm")'
        ),
      solutionType: z.string().optional().describe("Type of solution provided"),
      summary: z
        .string()
        .optional()
        .describe("A brief summary of the question/answer pair"),
    },
    async (params: SaveEntryParams) => {
      try {
        // Get the latest database ID from environment
        const currentDatabaseId = process.env.NOTION_DATABASE_ID || databaseId;

        // Verify database exists and is accessible
        try {
          await notion.databases.retrieve({
            database_id: currentDatabaseId,
          });
        } catch (error) {
          throw new Error(
            `Could not access database. Please make sure the database exists and is shared with your integration.`
          );
        }

        const {
          question,
          answer,
          category,
          tags = [],
          solutionType = "Explanation",
          summary = "",
        } = params;

        // Create the page in Notion
        const response = (await notion.pages.create({
          parent: { database_id: currentDatabaseId },
          properties: {
            Name: {
              title: [{ text: { content: generateTitle(question) } }],
            },
            Tags: {
              multi_select: tags.map((tag) => ({ name: tag.toLowerCase() })),
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
            "Solution Type": {
              select: { name: solutionType },
            },
            Date: {
              date: { start: new Date().toISOString().split("T")[0] },
            },
            // Add initial mastery level
            "Mastery Level": {
              select: {
                name: `${spacedRepetitionConfig.MASTERY_LEVELS.INITIAL.stars} ${spacedRepetitionConfig.MASTERY_LEVELS.INITIAL.name}`,
              },
            },
            // Add initial learning status
            "Learning Status": {
              select: {
                name: spacedRepetitionConfig.LEARNING_STATUS.NEW,
              },
            },
            // Set Last Reviewed to creation date
            "Last Reviewed": {
              date: {
                start: new Date().toISOString().split("T")[0],
              },
            },
            // Next Review will be automatically calculated by the formula
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
              type: "divider",
              divider: {},
            },
            // Convert JSON response to structured blocks
            ...convertResponseToBlocks(answer),
            {
              object: "block",
              type: "divider",
              divider: {},
            },
          ],
        })) as PageObjectResponse;

        return {
          content: [
            {
              type: "text",
              text: `Successfully saved entry to Notion database`,
            },
          ],
          json: {
            pageId: response.id,
            url: `https://notion.so/${response.id.replace(/-/g, "")}`,
          },
        };
      } catch (err) {
        const error = err as Error;
        return {
          content: [
            {
              type: "text",
              text: `Failed to save entry: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Register a tool to query the Notion database
  server.tool(
    "notion_query_database",
    "Query your Notion database for existing entries",
    {
      query: z
        .string()
        .optional()
        .describe("Text to search for in titles or content"),
      category: z.string().optional().describe("Filter by category"),
      tag: z.string().optional().describe("Filter by tag"),
      limit: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .describe("Maximum number of results to return"),
    },
    async (params: QueryDatabaseParams) => {
      try {
        const { query, category, tag, limit = 5 } = params;

        // Build filter conditions
        const filter: any = { and: [] };

        if (query) {
          filter.and.push({
            property: "Name",
            title: {
              contains: query,
            },
          });
        }

        if (category) {
          filter.and.push({
            property: "Category",
            select: {
              equals: category,
            },
          });
        }

        if (tag) {
          filter.and.push({
            property: "Tags",
            multi_select: {
              contains: tag,
            },
          });
        }

        // If no filters, don't use the "and" clause
        const finalFilter = filter.and.length > 0 ? filter : undefined;

        // Query the database
        const response = await notion.databases.query({
          database_id: databaseId,
          filter: finalFilter,
          page_size: limit,
          sorts: [
            {
              timestamp: "created_time",
              direction: "descending",
            },
          ],
        });

        // Process results
        const entries = await Promise.all(
          response.results.map(async (page) => {
            const pageObj = page as PageObjectResponse;
            const pageId = pageObj.id;

            // Extract properties
            const titleProperty = pageObj.properties?.Name;
            const categoryProperty = pageObj.properties?.Category;
            const summaryProperty = pageObj.properties?.Summary;
            const dateProperty = pageObj.properties?.Date;
            const solutionTypeProperty = pageObj.properties?.["Solution Type"];

            const title =
              titleProperty?.type === "title" && titleProperty.title.length > 0
                ? titleProperty.title[0]?.plain_text || "Untitled"
                : "Untitled";

            const categoryValue =
              categoryProperty?.type === "select" && categoryProperty.select
                ? categoryProperty.select.name
                : "Uncategorized";

            const summary =
              summaryProperty?.type === "rich_text" &&
              summaryProperty.rich_text.length > 0
                ? summaryProperty.rich_text[0]?.plain_text
                : "";

            const date =
              dateProperty?.type === "date" && dateProperty.date
                ? dateProperty.date.start
                : "";

            const solutionType =
              solutionTypeProperty?.type === "select" &&
              solutionTypeProperty.select
                ? solutionTypeProperty.select.name
                : "Unknown";

            return {
              id: pageId,
              title,
              category: categoryValue,
              summary,
              date,
              solutionType,
              url: `https://notion.so/${pageId.replace(/-/g, "")}`,
            };
          })
        );

        // Format the response
        const responseText =
          entries.length > 0
            ? `Found ${entries.length} entries${
                category ? ` in category "${category}"` : ""
              }:\n\n` +
              entries
                .map(
                  (entry) =>
                    `${entry.title}\n` +
                    `\nSolution Type: ${entry.solutionType}` +
                    `\nCategory: ${entry.category}` +
                    `\nSummary: ${entry.summary}` +
                    `\nDate: ${entry.date}\n`
                )
                .join("\n---\n\n")
            : `No entries found${
                category ? ` in category "${category}"` : ""
              }.`;

        return {
          content: [
            {
              type: "text",
              text: responseText,
            },
          ],
          json: entries,
        };
      } catch (err) {
        const error = err as Error;
        process.stderr.write(
          `Failed to query Notion database: ${error.message || error}\n`
        );
        return {
          content: [
            {
              type: "text",
              text: `Failed to query database: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Register spaced repetition tools
  server.tool(
    "notion_check_reviews",
    "Check for entries that need review based on spaced repetition schedule",
    {
      days: z
        .number()
        .optional()
        .describe("Number of days to look back (default: 7)"),
      includeUpcoming: z
        .boolean()
        .optional()
        .describe("Whether to include upcoming reviews in next 2 days"),
    },
    async (params: { days?: number; includeUpcoming?: boolean }) => {
      try {
        const { days = 7, includeUpcoming = true } = params;

        // Calculate dates
        const today = new Date();
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - days);

        const upcomingDate = new Date(today);
        if (includeUpcoming) {
          upcomingDate.setDate(upcomingDate.getDate() + 7); // Always show next 7 days
        }

        // Query the database
        const response = await notion.databases.query({
          database_id: databaseId,
          filter: {
            and: [
              {
                property: "Last Reviewed",
                date: {
                  before: today.toISOString().split("T")[0],
                },
              },
              {
                property: "Learning Status",
                select: {
                  does_not_equal:
                    spacedRepetitionConfig.LEARNING_STATUS.MASTERED,
                },
              },
            ],
          },
          sorts: [
            {
              property: "Last Reviewed",
              direction: "ascending",
            },
          ],
        });

        // Process results
        const overdueEntries: any[] = [];
        const upcomingEntries: any[] = [];
        const todayEntries: any[] = [];

        response.results.forEach((page: any) => {
          const lastReviewed = new Date(
            page.properties["Last Reviewed"].date.start
          );
          const nextReview = new Date(
            page.properties["Next Review"].date.start
          );

          const entry = {
            id: page.id,
            title: page.properties.Name.title[0].text.content,
            masteryLevel: page.properties["Mastery Level"].select.name,
            lastReviewed: page.properties["Last Reviewed"].date.start,
            nextReview: page.properties["Next Review"].date.start,
            category: page.properties.Category.select.name,
            url: `https://notion.so/${page.id.replace(/-/g, "")}`,
          };

          const daysSinceLastReview = Math.floor(
            (today.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastReview > 7) {
            overdueEntries.push({
              ...entry,
              daysOverdue: daysSinceLastReview,
            });
          } else if (nextReview.toDateString() === today.toDateString()) {
            todayEntries.push(entry);
          } else if (nextReview <= upcomingDate) {
            upcomingEntries.push({
              ...entry,
              daysUntilReview: Math.floor(
                (nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              ),
            });
          }
        });

        // Sort entries by days overdue/until review
        overdueEntries.sort((a, b) => b.daysOverdue - a.daysOverdue);
        upcomingEntries.sort((a, b) => a.daysUntilReview - b.daysUntilReview);

        // Create response
        let responseText = "📚 Learning programme for the next 7 days:：\n\n";

        if (overdueEntries.length > 0) {
          responseText +=
            "⚠️ Content that needs to be reviewed immediately:\n" +
            overdueEntries
              .map(
                (entry) =>
                  `• ${entry.title}\n  ${entry.masteryLevel} | 上次複習: ${entry.lastReviewed} (${entry.daysOverdue} 天前)\n  ${entry.url}`
              )
              .join("\n\n") +
            "\n\n";
        }

        if (todayEntries.length > 0) {
          responseText +=
            "📅 Need to review today:：\n" +
            todayEntries
              .map(
                (entry) =>
                  `• ${entry.title}\n  ${entry.masteryLevel}\n  ${entry.url}`
              )
              .join("\n\n") +
            "\n\n";
        }

        if (upcomingEntries.length > 0 && includeUpcoming) {
          responseText +=
            "🔜 Review is needed for the next 7 days:\n" +
            upcomingEntries
              .map(
                (entry) =>
                  `• ${entry.title}\n  ${entry.masteryLevel} | 預計複習日期: ${entry.nextReview} (${entry.daysUntilReview} 天後)\n  ${entry.url}`
              )
              .join("\n\n") +
            "\n\n";
        }

        if (
          overdueEntries.length === 0 &&
          todayEntries.length === 0 &&
          (!includeUpcoming || upcomingEntries.length === 0)
        ) {
          responseText +=
            "✨ It's great! There is nothing to review at this time.！\n";
        }

        return {
          content: [
            {
              type: "text",
              text: responseText,
            },
          ],
          json: {
            overdue: overdueEntries,
            today: todayEntries,
            upcoming: upcomingEntries,
          },
        };
      } catch (error) {
        const err = error as Error;
        return {
          content: [
            {
              type: "text",
              text: `Failed to check reviews: ${err.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool to update mastery level
  server.tool(
    "notion_update_mastery",
    "Update the mastery level of an entry and schedule next review",
    {
      pageId: z.string().describe("The ID of the Notion page to update"),
      masteryLevel: z
        .enum(
          Object.keys(spacedRepetitionConfig.MASTERY_LEVELS) as [
            string,
            ...string[]
          ]
        )
        .describe("The new mastery level to set"),
    },
    async (params: {
      pageId: string;
      masteryLevel: keyof typeof spacedRepetitionConfig.MASTERY_LEVELS;
    }) => {
      try {
        const { pageId, masteryLevel } = params;

        // Calculate next review date
        const today = new Date();
        const daysToAdd =
          spacedRepetitionConfig.MASTERY_LEVELS[masteryLevel].days;
        const nextReview = new Date(today.setDate(today.getDate() + daysToAdd));
        const nextReviewDate = nextReview.toISOString().split("T")[0];

        // Get current review count
        const page = (await notion.pages.retrieve({
          page_id: pageId,
        })) as PageObjectResponse;
        const reviewCountProp = page.properties[
          "Review Count"
        ] as NumberPropertyItemObjectResponse;
        const currentReviewCount = reviewCountProp.number || 0;

        // Update the page
        const updateParams: UpdatePageParameters = {
          page_id: pageId,
          properties: {
            "Mastery Level": {
              select: {
                name: `${spacedRepetitionConfig.MASTERY_LEVELS[masteryLevel].stars} ${spacedRepetitionConfig.MASTERY_LEVELS[masteryLevel].name}`,
              },
            },
            "Learning Status": {
              select: {
                name:
                  masteryLevel === "MASTERED"
                    ? spacedRepetitionConfig.LEARNING_STATUS.MASTERED
                    : spacedRepetitionConfig.LEARNING_STATUS.IN_PROGRESS,
              },
            },
            "Next Review": {
              date: { start: nextReviewDate },
            },
            "Review Count": {
              number: currentReviewCount + 1,
            },
            "Last Reviewed": {
              date: { start: new Date().toISOString().split("T")[0] },
            },
          },
        };

        await notion.pages.update(updateParams);

        return {
          content: [
            {
              type: "text",
              text: `✨ Successfully updated mastery level!\n\nNew level: ${spacedRepetitionConfig.MASTERY_LEVELS[masteryLevel].stars} ${spacedRepetitionConfig.MASTERY_LEVELS[masteryLevel].name}\nNext review: ${nextReviewDate}`,
            },
          ],
        };
      } catch (error) {
        const err = error as Error;
        return {
          content: [
            {
              type: "text",
              text: `Failed to update mastery level: ${err.message}`,
            },
          ],
        };
      }
    }
  );
}

// Helper function to generate a title from a question
function generateTitle(question: string): string {
  // Define professional emoji categories with more diverse options
  const emojiMap = {
    programming: ["💻", "⌨️", "🖥️", "👨‍💻", "👩‍💻", "🚀", "⚡", "🔧", "🛠️", "📱"],
    database: ["📊", "🗄️", "💾", "🎲", "📈", "📉", "🗃️", "📑", "🏢", "📓"],
    web: ["🌐", "🔌", "🔗", "🌍", "🎯", "🎨", "📡", "🔄", "🖧", "🔮"],
    ai: ["🤖", "🧠", "💡", "🔮", "🎓", "🔬", "🎯", "📊", "🧪", "💭"],
    security: ["🔒", "🛡️", "🔑", "🔐", "⚔️", "🚨", "🎯", "🔰", "🏰", "💂"],
    architecture: ["🏗️", "📐", "🔨", "🎡", "🎪", "🌉", "🏛️", "🔧", "📝", "🎨"],
    performance: ["⚡", "📈", "🎯", "🚀", "⏱️", "🔋", "💪", "🎮", "🔥", "💫"],
    testing: ["✅", "🧪", "🔍", "🎯", "📋", "🔬", "🎮", "🎲", "📊", "🎪"],
    cloud: ["☁️", "🌩️", "🌐", "📡", "🔌", "🖧", "📤", "📥", "🔄", "💨"],
    mobile: ["📱", "🤳", "📲", "🔌", "💬", "🎮", "🎯", "📍", "🔍", "💫"],
    devops: ["🔄", "⚙️", "🔧", "🚀", "🔁", "📦", "🎯", "🔨", "🛠️", "🔌"],
    analytics: ["📊", "📈", "📉", "🔍", "🎯", "💡", "🧮", "🔢", "📑", "🗂️"],
    general: ["✨", "💫", "🌟", "💪", "🎯", "📝", "💡", "🎨", "��", "🎪"],
  };

  // Remove verbose phrases and clean up
  let cleaned = question
    .replace(
      /^(can you|could you|please|help me|i want to|how to|how do i|what is|what are|tell me about|explain|show me|write|implement|create|build|make|develop)/i,
      ""
    )
    .replace(/\?|\.|\,|\!|\s+/g, " ")
    .replace(/\s+(a|an|the)\s+/gi, " ")
    .trim();

  // Enhanced category detection with more keywords
  let emojiCategory = "general";
  if (
    /\b(database|sql|query|schema|mongodb|postgres|redis|nosql|orm|jdbc)\b/i.test(
      cleaned
    )
  ) {
    emojiCategory = "database";
  } else if (
    /\b(api|http|rest|graphql|endpoint|fetch|axios|request|response|cors)\b/i.test(
      cleaned
    )
  ) {
    emojiCategory = "web";
  } else if (
    /\b(ai|ml|model|neural|train|inference|deep learning|nlp|tensorflow|pytorch)\b/i.test(
      cleaned
    )
  ) {
    emojiCategory = "ai";
  } else if (
    /\b(security|auth|encryption|token|jwt|oauth|password|hash|crypto|ssl)\b/i.test(
      cleaned
    )
  ) {
    emojiCategory = "security";
  } else if (
    /\b(architecture|design|pattern|structure|solid|dry|kiss|yagni|mvc|mvvm)\b/i.test(
      cleaned
    )
  ) {
    emojiCategory = "architecture";
  } else if (
    /\b(performance|optimization|speed|memory|cache|latency|throughput|benchmark|profiling)\b/i.test(
      cleaned
    )
  ) {
    emojiCategory = "performance";
  } else if (
    /\b(test|testing|unit|integration|coverage|jest|mocha|cypress|selenium|qa)\b/i.test(
      cleaned
    )
  ) {
    emojiCategory = "testing";
  } else if (
    /\b(cloud|aws|azure|gcp|serverless|lambda|s3|ec2|docker|kubernetes)\b/i.test(
      cleaned
    )
  ) {
    emojiCategory = "cloud";
  } else if (
    /\b(mobile|ios|android|react native|flutter|swift|kotlin|app|responsive)\b/i.test(
      cleaned
    )
  ) {
    emojiCategory = "mobile";
  } else if (
    /\b(devops|ci|cd|pipeline|jenkins|github actions|gitlab|deploy|release)\b/i.test(
      cleaned
    )
  ) {
    emojiCategory = "devops";
  } else if (
    /\b(analytics|metrics|dashboard|visualization|report|bi|data|statistics|tracking)\b/i.test(
      cleaned
    )
  ) {
    emojiCategory = "analytics";
  } else if (
    /\b(javascript|python|java|code|function|bug|error|debug|syntax|compiler)\b/i.test(
      cleaned
    )
  ) {
    emojiCategory = "programming";
  }

  // Get category emoji
  const emojis = emojiMap[emojiCategory as keyof typeof emojiMap];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  // Technical terms to preserve casing
  const technicalTerms = [
    "API",
    "REST",
    "GraphQL",
    "HTTP",
    "HTTPS",
    "JWT",
    "JSON",
    "XML",
    "SQL",
    "NoSQL",
    "CSS",
    "HTML",
    "JavaScript",
    "TypeScript",
    "Node.js",
    "React",
    "Vue",
    "Angular",
    "MongoDB",
    "PostgreSQL",
    "Redis",
    "AWS",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "Git",
    "npm",
    "yarn",
    "webpack",
    "ESLint",
    "Jest",
    "Mocha",
    "Express",
  ];

  // Convert to professional title case
  let words = cleaned.split(" ");
  words = words.map((word, index) => {
    // Check if it's a technical term
    const techTerm = technicalTerms.find(
      (term) => term.toLowerCase() === word.toLowerCase()
    );
    if (techTerm) return techTerm;

    // Skip capitalizing certain words unless they're at the start
    const lowerCaseWords = [
      "a",
      "an",
      "and",
      "as",
      "at",
      "but",
      "by",
      "for",
      "in",
      "of",
      "on",
      "or",
      "the",
      "to",
      "with",
    ];
    if (index === 0 || !lowerCaseWords.includes(word.toLowerCase())) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
  });

  // Rejoin with proper spacing
  cleaned = words.join(" ");

  // Handle numbers at the start
  cleaned = cleaned.replace(/^(\d+)/, "#$1");

  // Add emoji and ensure length limit
  let title = `${emoji} ${cleaned}`;

  // If too long, truncate at word boundary
  if (title.length > 50) {
    const breakPoint = title.lastIndexOf(" ", 47);
    title = title.substring(0, breakPoint > 0 ? breakPoint : 47) + "...";
  }

  return title;
}

async function checkExistingDatabase(notion: Client, databaseId: string) {
  if (!databaseId) {
    return null;
  }

  try {
    const database = (await notion.databases.retrieve({
      database_id: databaseId,
    })) as DatabaseObjectResponse;

    // Double check if this database is in the correct parent page
    const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
    if (
      database.parent?.type === "page_id" &&
      database.parent.page_id !== parentPageId
    ) {
      process.stderr.write(`⚠️ Found database but it's in a different page\n`);
      return null;
    }

    // Verify this is our AI Question Tracker database
    const title = database.title?.[0]?.plain_text || "";
    if (!title.includes("AI Question Tracker")) {
      process.stderr.write(
        `⚠️ Found database but it's not an AI Question Tracker\n`
      );
      return null;
    }

    return database;
  } catch (error) {
    // If we get a 404, the database doesn't exist
    const err = error as Error & { status?: number };
    if (err.status === 404) {
      process.stderr.write(`⚠️ Database ${databaseId} not found\n`);
    }
    return null;
  }
}

// Add helper function to convert response to Notion blocks
function convertResponseToBlocks(content: string): any[] {
  try {
    // Try to parse as JSON first
    const jsonContent = JSON.parse(content);
    return convertJsonToBlocks(jsonContent);
  } catch (e) {
    // If not JSON, process as regular text with markdown-like syntax
    return convertTextToBlocks(content);
  }
}

function convertJsonToBlocks(json: any): any[] {
  const blocks: any[] = [];

  // Handle different response structures
  if (json.content) {
    // Handle MCP-style response
    blocks.push({
      object: "block",
      type: "callout",
      callout: {
        rich_text: [{ text: { content: "API Response" } }],
        icon: { emoji: "🔄" },
        color: "blue_background",
      },
    });

    json.content.forEach((item: any) => {
      if (item.type === "text") {
        blocks.push(...convertTextToBlocks(item.text));
      } else if (item.type === "code") {
        blocks.push({
          object: "block",
          type: "code",
          code: {
            rich_text: [{ text: { content: item.code } }],
            language: item.language || "plain text",
          },
        });
      }
    });
  } else {
    // Handle regular JSON structure
    blocks.push({
      object: "block",
      type: "code",
      code: {
        rich_text: [{ text: { content: JSON.stringify(json, null, 2) } }],
        language: "json",
      },
    });
  }

  return blocks;
}

function convertTextToBlocks(text: string): any[] {
  const blocks: any[] = [];
  const lines = text.split("\n");
  let currentCodeBlock: string[] = [];
  let inCodeBlock = false;

  lines.forEach((line) => {
    // Code block handling
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        blocks.push({
          object: "block",
          type: "code",
          code: {
            rich_text: [{ text: { content: currentCodeBlock.join("\n") } }],
            language: "plain text",
          },
        });
        currentCodeBlock = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      currentCodeBlock.push(line);
      return;
    }

    // Heading handling
    if (line.startsWith("# ")) {
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [{ text: { content: line.slice(2) } }],
        },
      });
      return;
    }

    if (line.startsWith("## ")) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: line.slice(3) } }],
        },
      });
      return;
    }

    if (line.startsWith("### ")) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ text: { content: line.slice(4) } }],
        },
      });
      return;
    }

    // List handling
    if (line.startsWith("- ")) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: line.slice(2) } }],
        },
      });
      return;
    }

    if (line.match(/^\d+\. /)) {
      blocks.push({
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [{ text: { content: line.replace(/^\d+\. /, "") } }],
        },
      });
      return;
    }

    // Callout handling
    if (line.startsWith("> ")) {
      blocks.push({
        object: "block",
        type: "callout",
        callout: {
          rich_text: [{ text: { content: line.slice(2) } }],
          icon: { emoji: "💡" },
        },
      });
      return;
    }

    // Regular paragraph
    if (line.trim()) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ text: { content: line } }],
        },
      });
    } else {
      // Empty line
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [],
        },
      });
    }
  });

  return blocks;
}

// Run the main function
main().catch((err) => {
  const error = err as Error;
  process.stderr.write(
    `Failed to start MCP server: ${error.message || error}\n`
  );
  process.exit(1);
});
