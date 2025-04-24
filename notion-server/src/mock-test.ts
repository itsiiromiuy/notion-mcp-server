/**
 * Mock test for the Notion MCP Server
 * This simulates what would be saved to Notion without requiring actual credentials
 */

// Sample question and answer for testing
const testQuestion = "How do I implement a binary search tree in JavaScript?";
const testAnswer = `To implement a binary search tree in JavaScript:

1. Create a Node class with value, left, and right properties:
\`\`\`javascript
class Node {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}
\`\`\`

2. Create a BST class with insert, search and traverse methods:
\`\`\`javascript
class BinarySearchTree {
  constructor() {
    this.root = null;
  }
  
  insert(value) {
    const newNode = new Node(value);
    
    if (this.root === null) {
      this.root = newNode;
      return this;
    }
    
    let current = this.root;
    
    while (true) {
      if (value === current.value) return undefined;
      if (value < current.value) {
        if (current.left === null) {
          current.left = newNode;
          return this;
        }
        current = current.left;
      } else {
        if (current.right === null) {
          current.right = newNode;
          return this;
        }
        current = current.right;
      }
    }
  }
  
  search(value) {
    if (this.root === null) return false;
    
    let current = this.root;
    let found = false;
    
    while (current && !found) {
      if (value < current.value) {
        current = current.left;
      } else if (value > current.value) {
        current = current.right;
      } else {
        found = true;
      }
    }
    
    return found ? current : false;
  }
  
  // Add other traversal methods as needed
}
\`\`\`

3. Usage example:
\`\`\`javascript
const tree = new BinarySearchTree();
tree.insert(10);
tree.insert(5);
tree.insert(13);
tree.insert(2);
tree.insert(7);
console.error(tree.search(7)); // Node with value 7
console.error(tree.search(11)); // false
\`\`\`

BSTs provide efficient O(log n) operations for insertion, deletion, and searching when balanced.`;

// Process the question automatically
function processQuestion(question: string, answer: string) {
  // Extract metadata
  const category = detectCategory(question + " " + answer);
  const tags = extractTags(question + " " + answer);
  const codeRelated = detectCodeRelated(question + " " + answer);
  const solutionType = detectSolutionType(question + " " + answer);

  // Generate summary
  const summary = {
    date: new Date().toISOString().split("T")[0],
    category,
    question_title: generateTitle(question),
    summary: generateSummary(question, answer),
    tags,
    code_related: codeRelated,
    solution_type: solutionType,
  };

  // Log what would be saved to Notion
  console.error("\n🧪 Simulating MCP Server for AI-Notion Integration");
  console.error("-----------------------------------------------");
  console.error("📋 Here is what would be saved to Notion:\n");

  console.error("DATABASE ENTRY PROPERTIES:");
  console.error("------------------------");
  console.error(`Title: ${summary.question_title}`);
  console.error(`Category: ${summary.category}`);
  console.error(`Tags: ${summary.tags.join(", ")}`);
  console.error(`Code Related: ${summary.code_related}`);
  console.error(`Solution Type: ${summary.solution_type}`);
  console.error(`Date: ${summary.date}`);

  console.error("\nPAGE CONTENT:");
  console.error("-------------");
  console.error("## 问题详情\n");
  console.error(question);
  console.error("\n## 解决方案\n");
  console.error(answer);
  console.error("\n---\n");
  console.error("*自动生成的记录 - MCP Server for AI-Notion Integration*");

  console.error("\nJSON SUMMARY:");
  console.error("-------------");
  console.error(JSON.stringify(summary, null, 2));

  return summary;
}

// Helper functions for extracting metadata
function generateTitle(question: string): string {
  return (
    question.split("\n")[0].trim().slice(0, 50) +
    (question.length > 50 ? "..." : "")
  );
}

function generateSummary(question: string, answer: string): string {
  const maxQuestionLength = 300;
  const maxAnswerLength = 600;

  const shortQuestion =
    question.length > maxQuestionLength
      ? question.slice(0, maxQuestionLength) + "..."
      : question;

  const shortAnswer =
    answer.length > maxAnswerLength
      ? answer.slice(0, maxAnswerLength) + "..."
      : answer;

  return `## 问题描述\n\n${shortQuestion}\n\n## 解决方案\n\n${shortAnswer}\n\n---\n\n*自动生成的摘要 - 由 MCP Server for AI-Notion Integration 创建*`;
}

function detectCategory(content: string): string {
  const lowercaseContent = content.toLowerCase();

  const categories = {
    React: ["react", "component", "hook", "jsx", "state management"],
    JavaScript: ["javascript", "js", "es6", "promise", "async"],
    TypeScript: ["typescript", "ts", "interface", "type"],
    Python: ["python", "django", "flask", "pandas", "numpy"],
    Database: ["sql", "database", "mysql", "mongodb"],
    DevOps: ["docker", "kubernetes", "k8s", "ci/cd", "deployment"],
    Frontend: ["html", "css", "dom", "frontend", "browser"],
    Backend: ["backend", "server", "api", "rest", "graphql"],
    Mobile: ["mobile", "react native", "flutter", "ios", "android"],
    "Data Structures": [
      "tree",
      "array",
      "linked list",
      "graph",
      "binary search tree",
      "hash table",
    ],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowercaseContent.includes(keyword))) {
      return category;
    }
  }

  return "General";
}

function detectCodeRelated(content: string): boolean {
  const codeIndicators = [
    "code",
    "function",
    "class",
    "method",
    "variable",
    "bug",
    "error",
    "syntax",
    "compile",
    "runtime",
  ];

  const lowercaseContent = content.toLowerCase();
  return codeIndicators.some((indicator) =>
    lowercaseContent.includes(indicator)
  );
}

function detectSolutionType(
  content: string
): "Implementation" | "Debug" | "Concept" | "Tool Usage" {
  const lowercaseContent = content.toLowerCase();

  if (
    lowercaseContent.includes("debug") ||
    lowercaseContent.includes("bug") ||
    lowercaseContent.includes("error") ||
    lowercaseContent.includes("fix")
  ) {
    return "Debug";
  }

  if (
    lowercaseContent.includes("tool") ||
    lowercaseContent.includes("library") ||
    lowercaseContent.includes("framework")
  ) {
    return "Tool Usage";
  }

  if (
    lowercaseContent.includes("concept") ||
    lowercaseContent.includes("theory") ||
    lowercaseContent.includes("pattern")
  ) {
    return "Concept";
  }

  return "Implementation";
}

function extractTags(content: string): string[] {
  const tags = new Set<string>();
  const lowercaseContent = content.toLowerCase();

  // 常见编程主题
  const topics = {
    languages: [
      "javascript",
      "typescript",
      "python",
      "java",
      "c++",
      "c#",
      "go",
      "rust",
      "php",
      "ruby",
    ],
    frameworks: [
      "react",
      "vue",
      "angular",
      "svelte",
      "node",
      "express",
      "next.js",
      "nuxt",
      "django",
      "flask",
      "spring",
    ],
    concepts: [
      "api",
      "database",
      "testing",
      "debug",
      "performance",
      "security",
      "algorithm",
      "data structure",
      "design pattern",
      "binary search tree",
      "tree",
    ],
    tools: [
      "git",
      "docker",
      "kubernetes",
      "aws",
      "azure",
      "gcp",
      "notion",
      "vscode",
      "npm",
      "webpack",
      "babel",
    ],
  };

  // 添加检测到的主题作为标签
  Object.values(topics)
    .flat()
    .forEach((topic) => {
      if (lowercaseContent.includes(topic)) {
        tags.add(topic);
      }
    });

  // 限制标签数量，避免过多
  return Array.from(tags).slice(0, 5);
}

// Run the mock test
processQuestion(testQuestion, testAnswer);

console.error(
  "\n✅ To test with a real Notion database, update your .env file with:"
);
console.error(
  "---------------------------------------------------------------"
);
console.error("NOTION_API_TOKEN=your-notion-integration-token");
console.error("NOTION_DATABASE_ID=your-notion-database-id");
console.error("\nThen run the test with: ts-node src/test.ts");
