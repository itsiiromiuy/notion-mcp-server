export interface QASummary {
  date: string;
  category: string;
  question_title: string;
  summary: string;
  tags: string[];
  code_related: boolean;
  solution_type: "Implementation" | "Debug" | "Concept" | "Tool Usage";
}

export interface NotionConfig {
  auth: string;
  databaseId: string;
}

export interface ServerConfig {
  notion: NotionConfig;
}
