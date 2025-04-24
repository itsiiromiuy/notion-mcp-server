# MCP Server for AI-Notion Integration

A Model Context Protocol (MCP) server that integrates with Notion databases to store AI question/answer pairs. This server provides tools for AI assistants to save information to your Notion workspace.

## Features

- **Notion Database Integration**: Create and update entries in a Notion database for tracking AI conversations
- **Database Setup**: Tools to create a properly structured Notion database with the right properties
- **Query Support**: Search and retrieve entries from your database
- **ESM Compatibility**: Built with ES Module support for modern Node.js applications

## Prerequisites

- Node.js 18 or higher
- A Notion account with an [integration token](https://www.notion.so/my-integrations)
- A Notion database with appropriate properties (or use the setup script to create one)

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   NOTION_API_TOKEN=your_notion_integration_token
   NOTION_DATABASE_ID=your_notion_database_id
   NOTION_PARENT_PAGE_ID=your_notion_page_id (only needed for database setup)
   ```

## Notion Integration Setup

1. Go to [Notion Integrations](https://www.notion.so/my-integrations) and create a new integration
2. Give your integration a name (e.g., "AI QA Tracker") and select the appropriate capabilities (read & write)
3. Copy the "Internal Integration Token" and paste it into your `.env` file
4. Share your Notion database with your integration

## Database Setup

To create a new database structure for tracking AI questions/answers:

```bash
npm run build
node dist/setup-database.js
```

This will create a new database with all the required properties and fields.

## Usage

### Starting the server:

```bash
npm start
```

### Running tests:

To test your Notion connection:

```bash
npm test
```

## Tools Provided by the MCP Server

This server provides the following tools to AI assistants:

1. **notion_ai_save_entry**: Save an AI/LLM-related question and answer to your Notion database
2. **notion_query_database**: Query your Notion database for existing entries

## Development

### Building the project:

```bash
npm run build
```

### Running in development mode:

```bash
npm run dev
```

## License

ISC

## Acknowledgements

- [Notion API](https://developers.notion.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
