// import { Client } from "@notionhq/client";
// import * as dotenv from "dotenv";
// import { fileURLToPath } from "url";
// import { dirname, resolve } from "path";
// import { existsSync } from "fs";

// // 设置 __dirname 等效项用于 ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// const rootPath = __dirname;

// // 从 .env 文件加载环境变量
// const envPath = resolve(rootPath, ".env");

// if (existsSync(envPath)) {
//   console.error(`📄 Loading environment from ${envPath}`);
//   dotenv.config({ path: envPath });
// } else {
//   console.error(
//     "⚠️ No .env file found, using environment variables if available"
//   );
//   dotenv.config();
// }

// async function createDatabase() {
//   console.error("🔧 Setting up Notion Database for AI Question Tracking");

//   // 检查必要的环境变量
//   if (!process.env.NOTION_API_TOKEN) {
//     console.error("❌ NOTION_API_TOKEN environment variable is not set");
//     process.exit(1);
//   }

//   if (!process.env.NOTION_PARENT_PAGE_ID) {
//     console.error("❌ NOTION_PARENT_PAGE_ID environment variable is not set");
//     console.error("   This is required to create a new database");
//     process.exit(1);
//   }

//   const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
//   const parentPageId = process.env.NOTION_PARENT_PAGE_ID;

//   try {
//     // 创建新数据库
//     console.error(`📝 Creating new database in parent page: ${parentPageId}`);

//     const databaseParams = {
//       parent: {
//         type: "page_id",
//         page_id: parentPageId,
//       },
//       title: [
//         {
//           type: "text",
//           text: {
//             content: "Developer Learning Journal - AI Question Tracker",
//           },
//         },
//       ],
//       properties: {
//         Name: {
//           title: {},
//         },
//         Category: {
//           select: {
//             options: [
//               { name: "JavaScript", color: "blue" },
//               { name: "Python", color: "green" },
//               { name: "General Programming", color: "orange" },
//               { name: "AI/ML", color: "purple" },
//               { name: "Web Development", color: "red" },
//               { name: "DevOps", color: "gray" },
//               { name: "Other", color: "default" },
//             ],
//           },
//         },
//         Summary: {
//           rich_text: {},
//         },
//         Tags: {
//           multi_select: {
//             options: [
//               { name: "javascript", color: "blue" },
//               { name: "python", color: "green" },
//               { name: "algorithm", color: "red" },
//               { name: "data structure", color: "orange" },
//               { name: "frontend", color: "yellow" },
//               { name: "backend", color: "gray" },
//               { name: "machine learning", color: "purple" },
//               { name: "llm", color: "pink" },
//             ],
//           },
//         },
//         "Code Related": {
//           checkbox: {},
//         },
//         "Solution Type": {
//           select: {
//             options: [
//               { name: "Implementation", color: "blue" },
//               { name: "Explanation", color: "green" },
//               { name: "Debugging", color: "red" },
//               { name: "Best Practice", color: "orange" },
//               { name: "Performance", color: "yellow" },
//             ],
//           },
//         },
//         Date: {
//           date: {},
//         },
//       },
//       icon: {
//         type: "emoji",
//         emoji: "🧠",
//       },
//       cover: {
//         type: "external",
//         external: {
//           url: "https://images.unsplash.com/photo-1655720031554-a929595ffad7?q=80&w=1932&auto=format&fit=crop",
//         },
//       },
//     };

//     const response = await notion.databases.create(databaseParams);
//     console.error(`✅ Successfully created new database!`);
//     console.error(`   Database ID: ${response.id}`);

//     // 从 ID 生成 URL
//     const databaseUrl = `https://notion.so/${response.id.replace(/-/g, "")}`;
//     console.error(`   Database URL: ${databaseUrl}`);

//     console.error("\n⚠️ IMPORTANT: Add this database ID to your .env file:");
//     console.error(`NOTION_DATABASE_ID=${response.id}`);
//   } catch (err) {
//     const error = err;
//     console.error(`❌ Failed to set up database: ${error.message}`);
//     if (error.status === 404) {
//       console.error(
//         "   Parent page not found. Check your NOTION_PARENT_PAGE_ID."
//       );
//     } else if (error.status === 403) {
//       console.error(
//         "   Permission denied. Make sure your integration has write access to the parent page."
//       );
//     }
//     process.exit(1);
//   }
// }

// // 运行创建函数
// createDatabase().catch((err) => {
//   const error = err;
//   console.error("Unhandled error:", error.message || error);
//   process.exit(1);
// });
