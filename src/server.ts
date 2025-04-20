import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DatabaseFormatter, DatabaseHandler, DatabaseLoader } from "./database";
import z from "zod";

export const server = new McpServer({
  name: "ms-creator-mcp-server",
  version: "1.0.0",
});

const databaseLoader = new DatabaseLoader();
const databaseHandler = new DatabaseHandler(databaseLoader);
const databaseFormatter = new DatabaseFormatter();

// カテゴリ一覧を取得して返すツール
server.tool(
  "ms_creator_tag_categories",
  "Get categories for finding ms creator tags use with 'ms_creator_tag_search_by_category'. Normally the category is the same as target of the shop page name (e.g. '商品詳細', '会社概要'). The '全ページ共通' category contains common tags that can be used on any page. Use it as a first step in finding tags to see the available categories.",
  async () => {
    const categories = databaseHandler.getCategories();
    const respondResult = databaseFormatter.formatAsCategories(categories);
    return {
      content: [
        {
          type: "text",
          text: respondResult,
        },
      ],
    };
  }
);

// カテゴリ内のサブカテゴリ一覧を取得して返すツール
server.tool(
  "ms_creator_tag_sub_categories",
  "Get categories for finding ms creator tags use with 'ms_creator_tag_search_by_sub_category'. Use the exact category name obtained from the 'ms_creator_tag_categories' tool (e.g. '商品検索結果'). Use it as a second step in finding tags to see the available sub categories.",
  { categoryName: z.string().nonempty() },
  async ({ categoryName }) => {
    const categories = databaseHandler.getSubCategories(categoryName);
    const respondResult = databaseFormatter.formatAsSubCategories(categories);
    return {
      content: [
        {
          type: "text",
          text: respondResult,
        },
      ],
    };
  }
);

// カテゴリ名からタグ情報一覧を取得して返すツール
server.tool(
  "ms_creator_tag_search_by_category",
  "Gets a list of ms creator tags and descriptions that belong to a specified category name. Use the exact category name obtained from the 'ms_creator_tag_categories' tool (e.g. '商品検索結果'). Use this when you want to know which tags are available on a particular page (category). As note, this result may very large depending on the category name. You should try to use `ms_creator_tag_search_by_sub_category` to make it smaller.",
  { categoryName: z.string().nonempty() },
  async ({ categoryName }) => {
    const searchResult = databaseHandler.searchByCategory(categoryName);
    const respondResult = databaseFormatter.formatAsTagInfo(searchResult);
    return {
      content: [
        {
          type: "text",
          text: respondResult,
        },
      ],
    };
  }
);

// カテゴリとサブカテゴリ名からタグ情報一覧を取得して返すツール
server.tool(
  "ms_creator_tag_search_by_sub_category",
  "Gets a list of ms creator tags and descriptions that belong to a specified category name and sub category name. Use the exact category name obtained from the 'ms_creator_tag_categories' tool (e.g. '商品検索結果') and the exact sub category name obtained from the 'ms_creator_tag_sub_categories' tool (e.g. '商品名'). Use this when you want to know which tags are available on a particular page (category).",
  {
    categoryName: z.string().nonempty(),
    subCategoryName: z.string().nonempty(),
  },
  async ({ categoryName, subCategoryName }) => {
    const searchResult = databaseHandler.searchBySubCategory(
      categoryName,
      subCategoryName
    );
    const respondResult = databaseFormatter.formatAsTagInfo(searchResult);
    return {
      content: [
        {
          type: "text",
          text: respondResult,
        },
      ],
    };
  }
);

// 説明からタグを検索して返すツール
server.tool(
  "ms_creator_tag_search_by_keyword",
  "Search for related MS Creator tags based on keywords included in the tag description. For example, you can find related tags by searching for keywords such as '商品名' or '価格'. Use this when you want to find tags that correspond to specific information but are unsure of the exact tag name or category.",
  { keyword: z.string().nonempty() },
  async ({ keyword }) => {
    const searchResult = databaseHandler.searchByTagDescription(keyword);
    const respondResult = databaseFormatter.formatAsTagInfo(searchResult);
    return {
      content: [
        {
          type: "text",
          text: respondResult,
        },
      ],
    };
  }
);

// タグから該当するタグ情報を取得して返すツール
server.tool(
  "ms_creator_tag_get_detail",
  "Gets detailed information (description, category, example, etc.) for an MS Creator tag matching the exact tag name specified (e.g. '$member.name'). Tag names must be an exact match and are case sensitive. Use if you need exact information for a specific tag. Use `ms_creator_tag_get_source` if you need the tag's source URL.",
  { tagName: z.string().nonempty() },
  async ({ tagName }) => {
    const searchResult = databaseHandler.searchByTagName(tagName);
    const respondResult = databaseFormatter.formatAsTagInfo(searchResult);
    return {
      content: [
        {
          type: "text",
          text: respondResult,
        },
      ],
    };
  }
);

// タグから該当するタグの出典情報を取得して返すツール
server.tool(
  "ms_creator_tag_get_source",
  "Gets the **source URL** of an MS Creator tag that matches the exact tag name specified (e.g. '$member.name'). The tag name must be an exact match and is case-sensitive. Use this tool **only** if you want a URL to a document that defines or specifies the tag. Use `ms_creator_tag_get_detail` if you want basic information like the tag description and category.",
  { tagName: z.string().nonempty() },
  async ({ tagName }) => {
    const searchResult = databaseHandler.searchByTagName(tagName);
    const respondResult = databaseFormatter.formatAsSourceInfo(searchResult);
    return {
      content: [
        {
          type: "text",
          text: respondResult,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // 標準出力すると MCPのやり取りを邪魔するのでエラーで表示する
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
