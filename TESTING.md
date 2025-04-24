# Testing the MCP Server for AI-Notion Integration

This guide will help you test your MCP Server for AI-Notion Integration to ensure it can properly save Q&A content to your Notion database.

## Prerequisites

Before testing, make sure you have:

1. A Notion account
2. Created a Notion integration and obtained your integration token
3. Created a Notion database with the required properties
4. Shared your database with your integration
5. Copied your database ID (in UUID format)

## Step 1: Configure Environment Variables

1. Create a `.env` file in the project root (or copy from `.env.example`):

```
# Notion Integration Configuration
NOTION_API_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id
```

2. Replace the placeholders with your actual credentials.

## Step 2: Run the Mock Test

The mock test will simulate how data would be saved to Notion without actually saving anything:

```bash
npx ts-node src/mock-test.ts
```

This will show you:

- What properties would be saved to your database
- What content would be created in the page
- The JSON summary of the data

## Step 3: Test with Real Notion Database

If the mock test looks good, test with your actual Notion database:

```bash
npx ts-node src/test.ts
```

This will:

1. Validate your Notion credentials
2. Connect to your database
3. Create a test entry with sample Q&A content
4. Provide a link to view the created entry

If successful, you should see a new entry in your Notion database.

## Step 4: Start the MCP Server

```bash
npm start
```

This will start the MCP server which can be used with Claude for Desktop or other clients.

## Common Issues

### Invalid Database ID

If you're seeing an error about an invalid database ID, ensure your database ID is in the correct UUID format:

```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

You can find this in your database URL:
`https://www.notion.so/workspace/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx?v=...`

### Permission Issues

If you're getting permission errors, ensure that:

1. Your integration token is correct
2. You've shared your database with your integration
3. Your integration has "Read content" and "Insert content" capabilities

### Missing Database Properties

If you're getting property validation errors, make sure your Notion database has these properties:

- Title (title type)
- Category (select type)
- Summary (rich text type)
- Tags (multi-select type)
- Code Related (checkbox type)
- Solution Type (select type)
- Date (date type)

## Using with Claude for Desktop

1. Edit Claude for Desktop configuration file:
   `~/Library/Application Support/Claude/claude_desktop_config.json`

2. Add your server:

   ```json
   {
     "mcpServers": {
       "notion-qa-sync": {
         "command": "npm",
         "args": ["start"],
         "cwd": "/path/to/your/notion-server"
       }
     }
   }
   ```

3. Restart Claude for Desktop
4. Look for the hammer icon to confirm connection
5. Try saving a question with:
   `Please save this question to my Notion database`
