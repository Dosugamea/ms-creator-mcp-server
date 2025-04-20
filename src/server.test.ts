import { describe, it, expect, beforeAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { server } from "./server.js";

describe("server.ts", () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({
      name: "test client",
      version: "0.1.0",
    });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    // クライアントとサーバーを接続
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  it("カテゴリ一覧を返す", async () => {
    const result = await client.callTool({
      name: "getMsCreatorTagCategories",
    });
    const expectedText = [
      "## Categories",
      "- 全ページ共通",
      "- 商品カテゴリー",
      "- 商品検索結果",
      "- 商品詳細",
      "- 商品レビュー一覧",
      "- 商品レビュー詳細",
      "- お知らせ一覧",
      "- お知らせ詳細",
      "- 利用案内",
      "- 会社概要",
      "- プライバシーポリシー",
      "- 会員制／年齢確認",
      "- 特定商取引法",
      "- カタログ",
      "- 修飾子",
    ].join("\n");
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expectedText,
        },
      ],
    });
  });

  it("カテゴリ名からタグ情報一覧を返す", async () => {
    const result = await client.callTool({
      name: "getMsCreatorTagsByCategory",
      arguments: {
        categoryName: "商品詳細",
      },
    });
    const expectedText = [
      "## $item.breadcrumb_list_group.has_item",
      "パンくずリストが複数あるかどうか（真偽値）",
      "",
      "### Category",
      "商品詳細",
    ].join("\n");

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining(expectedText),
        },
      ],
    });
  });

  it("説明からタグを検索して返す", async () => {
    const result = await client.callTool({
      name: "searchMsCreatorTag",
      arguments: {
        keyword: "商品名",
      },
    });
    const expectedText = [
      "## $item.name",
      "商品名",
      "",
      "### Category",
      "商品詳細",
    ].join("\n");

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining(expectedText),
        },
      ],
    });
  });

  it("タグから該当するタグ情報を取得して返す", async () => {
    const result = await client.callTool({
      name: "getMsCreatorTag",
      arguments: {
        tagName: "$item.name",
      },
    });
    const expectedText = [
      "## $item.name",
      "商品名",
      "",
      "### Category",
      "商品詳細",
    ].join("\n");

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining(expectedText),
        },
      ],
    });
  });

  it("タグから該当するタグ情報(出典URL)を取得して返す", async () => {
    const result = await client.callTool({
      name: "getMsCreatorTagSource",
      arguments: {
        tagName: "$item.name",
      },
    });
    const expectedText = [
      "## $item.name",
      "商品名",
      "",
      "### Category",
      "商品詳細",
      "### Category source link",
      "https://reference.makeshop.jp/creator-mode/contents/detail/index.html",
    ].join("\n");

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining(expectedText),
        },
      ],
    });
  });
});
