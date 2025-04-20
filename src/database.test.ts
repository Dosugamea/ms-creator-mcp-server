import { describe, it, expect, vi } from "vitest";
import { DatabaseLoader, DatabaseHandler, DatabaseFormatter } from "./database";
import type { DatabaseRawCategoryRecord, DatabaseRecord } from "./types";

describe("database.ts", () => {
  const mockFormattedData: DatabaseRecord[] = [
    {
      tagName: "<h1>",
      categoryName: "HTML Basics",
      categorySubName: "typography",
      tagDescription: "Heading level 1",
      categoryLink: "/html",
      tagLink: "/html/h1",
      tagSampleCode: "<h1>Title</h1>",
      tagHtmlOutputImage: "h1.png",
    },
    {
      tagName: "<p>",
      categoryName: "HTML Basics",
      categorySubName: "typography",
      tagDescription: "Paragraph",
      categoryLink: "/html",
      tagLink: "/html/p",
      tagSampleCode: "<p>Text</p>",
      tagHtmlOutputImage: null,
    },
  ];

  vi.mock("@/output.json", () => {
    const mockRawData: DatabaseRawCategoryRecord[] = [
      {
        name: "HTML Basics",
        link: "/html",
        tags: {
          typography: [
            {
              tag: "<h1>",
              description: "Heading level 1",
              link: "/html/h1",
              sample_code: "<h1>Title</h1>",
              html_output_image: "h1.png",
            },
            {
              tag: "<p>",
              description: "Paragraph",
              link: "/html/p",
              sample_code: "<p>Text</p>",
            },
          ],
        },
      },
    ];
    return {
      default: mockRawData,
    };
  });

  describe("DatabaseLoader", () => {
    it("正しい形式のデータを読み込むこと", () => {
      const loader = new DatabaseLoader();
      const result = loader.load();
      expect(result).toEqual(mockFormattedData);
    });
  });

  describe("DatabaseHandler", () => {
    const handler = new DatabaseHandler(new DatabaseLoader());

    it("カテゴリ一覧を取得できること", () => {
      expect(handler.getCategories()).toEqual(["HTML Basics"]);
    });

    it("カテゴリ検索が正しく動作すること", () => {
      const result = handler.searchByCategory("HTML Basics");
      expect(result).toEqual(mockFormattedData);
    });

    it("タグ名検索が正しく動作すること", () => {
      const result = handler.searchByTagName("<h1>");
      expect(result).toEqual([mockFormattedData[0]]);
    });

    it("タグ説明検索が正しく動作すること", () => {
      const result = handler.searchByTagDescription("Heading");
      expect(result).toEqual([mockFormattedData[0]]);
    });
  });

  describe("DatabaseFormatter", () => {
    const formatter = new DatabaseFormatter();

    it("カテゴリ形式のフォーマットが正しいこと", () => {
      const result = formatter.formatAsCategories([
        "HTML Basics",
        "CSS Basics",
      ]);
      expect(result).toBe(
        "## Categories\n" + "- HTML Basics\n" + "- CSS Basics"
      );
    });

    it("タグ情報のフォーマットが正しいこと", () => {
      const result = formatter.formatAsTagInfo([mockFormattedData[0]]);
      expect(result).toBe(
        "## <h1>\n" +
          "Heading level 1\n\n" +
          "### Category\n" +
          "HTML Basics\n" +
          "### Code Example\n" +
          "<h1>Title</h1>\n" +
          "### Output Example\n" +
          "h1.png"
      );
    });

    it("ソース情報のフォーマットが正しいこと", () => {
      const result = formatter.formatAsSourceInfo([mockFormattedData[0]]);
      expect(result).toBe(
        "## <h1>\n" +
          "Heading level 1\n\n" +
          "### Category\n" +
          "HTML Basics\n" +
          "### Category source link\n" +
          "/html\n" +
          "### Tag source link\n" +
          "/html/h1"
      );
    });

    it("空データの場合のエラーメッセージ表示", () => {
      const categoriesResult = formatter.formatAsCategories([]);
      expect(categoriesResult).toBe("Error: No categories found");

      const tagsResult = formatter.formatAsTagInfo([]);
      expect(tagsResult).toBe("Error: No tags found");
    });
  });
});
