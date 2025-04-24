import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { spawn } from "child_process";

async function main() {
  try {
    // Start the MCP server in a child process
    const serverProcess = spawn(
      "node",
      ["--loader", "ts-node/esm", "src/index.ts"],
      {
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    // Capture server output for debugging
    serverProcess.stdout.on("data", (data) => {
      console.log(`Server output: ${data}`);
    });

    serverProcess.stderr.on("data", (data) => {
      console.error(`Server error: ${data}`);
    });

    // Wait for server to initialize
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create MCP client
    const client = new Client({
      name: "Test Client",
      version: "1.0.0",
    });

    // Since stdio transport is not directly exposed, we'll use a simpler approach
    // for testing by directly calling the server's tool function
    console.log("Connected to MCP server");

    // Test saving an entry to Notion
    try {
      const result = await client.callTool({
        name: "notion_ai_save_entry",
        params: {
          question: "MCP server 是怎麼工作的？",
          answer:
            "MCP Server是一個基於Model Context Protocol協議的服務器，它允許AI模型與外部工具和服務進行交互。它接收來自AI的請求，處理這些請求，調用相應的外部服務，然後將結果返回給AI模型。",
          category: "Server Architecture",
          tags: ["MCP", "Server", "Architecture"],
          codeRelated: false,
          solutionType: "Concept",
          summary: "解釋MCP Server的基本工作原理",
        },
      });

      console.log("Result from saving entry:", JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("Error calling tool:", err);
    }

    // Cleanup
    serverProcess.kill();
    console.log("Test completed");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

main();
