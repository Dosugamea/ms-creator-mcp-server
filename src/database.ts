import { DatabaseRawCategoryRecord, DatabaseRecord } from "./types";
import output from "@/output.json";

export class DatabaseLoader {
  private formattedData: DatabaseRecord[] = [];

  constructor() {
    const parsedData = output as DatabaseRawCategoryRecord[];
    this.formattedData = this.transform(parsedData);
  }

  public load(): DatabaseRecord[] {
    return this.formattedData;
  }

  /**
   * DatabaseRawCategoryRecordの配列をDatabaseRecordの配列に変換する
   * @param rawCategories 変換元のカテゴリレコード配列
   * @returns 変換後のデータベースレコード配列
   */
  private transform(
    rawCategories: DatabaseRawCategoryRecord[]
  ): DatabaseRecord[] {
    const records: DatabaseRecord[] = [];

    for (const category of rawCategories) {
      // カテゴリ内の各タグについて処理
      for (const [categorySubName, tagDatas] of Object.entries(category.tags)) {
        for (const tagData of tagDatas) {
          records.push({
            tagName: tagData.tag,
            categoryName: category.name,
            categorySubName: categorySubName,
            tagDescription: tagData.description,
            categoryLink: category.link,
            tagLink: tagData.link,
            tagSampleCode: tagData.sample_code ?? null,
            tagHtmlOutputImage: tagData.html_output_image ?? null,
          });
        }
      }
    }
    return records;
  }
}

export class DatabaseHandler {
  private dbRaw: DatabaseRecord[] = [];
  private dbByCategory: Record<string, DatabaseRecord[]> = {};
  private dbBySubCategory: Record<string, Record<string, DatabaseRecord[]>> =
    {};
  private categories: string[] = [];

  constructor(database: DatabaseLoader) {
    this.dbRaw = database.load();
    this.categories = [
      ...new Set(this.dbRaw.map((record) => record.categoryName)),
    ];
    this.dbByCategory = this.dbRaw.reduce((acc, record) => {
      const category = record.categoryName;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(record);
      return acc;
    }, {} as Record<string, DatabaseRecord[]>);
    this.dbBySubCategory = this.dbRaw.reduce((acc, record) => {
      const category = record.categoryName;
      if (!acc[category]) {
        acc[category] = {} as Record<string, DatabaseRecord[]>;
      }
      const subCategory = record.categorySubName;
      if (!acc[category][subCategory]) {
        acc[category][subCategory] = [];
      }
      acc[category][subCategory].push(record);
      return acc;
    }, {} as Record<string, Record<string, DatabaseRecord[]>>);
  }

  /** カテゴリ一覧を取得して返す */
  getCategories(): string[] {
    return this.categories;
  }

  /** カテゴリ内のサブカテゴリ一覧を取得して返す */
  getSubCategories(categoryName: string): string[] {
    return Object.keys(this.dbBySubCategory[categoryName] || []);
  }

  /** カテゴリに対応するタグ情報配列を取得して返す */
  searchByCategory(category: string): DatabaseRecord[] {
    return this.dbByCategory[category] || [];
  }

  /** サブカテゴリに対応するタグ情報配列を取得して返す */
  searchBySubCategory(category: string, subCategory: string): DatabaseRecord[] {
    return this.dbBySubCategory[category][subCategory] || [];
  }

  /** タグ名に対応するタグ情報配列を取得して返す */
  searchByTagName(tagName: string): DatabaseRecord[] {
    return this.dbRaw.filter((record) => record.tagName === tagName);
  }

  /** 指定されたキーワードに対応するタグ情報を取得して返す */
  searchByTagDescription(keyword: string): DatabaseRecord[] {
    return this.dbRaw.filter(
      (record) =>
        record.tagDescription.includes(keyword) ||
        record.tagHtmlOutputImage?.includes(keyword)
    );
  }
}

export class DatabaseFormatter {
  formatAsCategories(categories: string[]): string {
    if (categories.length === 0) {
      return "Error: No categories found";
    }
    return (
      "## Categories\n" +
      categories.map((category) => `- ${category}`).join("\n")
    );
  }

  formatAsSubCategories(subCategories: string[]): string {
    if (subCategories.length === 0) {
      return "Error: No sub categories found";
    }
    return (
      "## Sub categories\n" +
      subCategories.map((category) => `- ${category}`).join("\n")
    );
  }

  formatAsTagInfo(tags: DatabaseRecord[]): string {
    if (tags.length === 0) {
      return "Error: No tags found";
    }

    return tags
      .map((tag) => {
        if (!tag.tagName.startsWith(".list[i]")) {
          const tagData = [
            `## ${tag.tagName}`,
            `${tag.tagDescription}`,
            "",
            `### Category`,
            tag.categoryName,
            `### Sub Category`,
            tag.categorySubName,
            `### Code Example`,
            tag.tagSampleCode || "No example provided",
            `### Output Example`,
            tag.tagHtmlOutputImage || "No example provided",
          ];
          return tagData.join("\n");
        } else {
          const tagData = [
            `## ${"$item.group" + tag.tagName}`,
            `${tag.tagDescription}`,
            "",
            `### Category`,
            tag.categoryName,
            `### Sub Category`,
            tag.categorySubName,
            `### Code Example`,
            tag.tagSampleCode || "No example provided",
          ];
          return tagData.join("\n");
        }
      })
      .join("\n\n");
  }

  formatAsSourceInfo(tags: DatabaseRecord[]): string {
    if (tags.length === 0) {
      return "Error: No tags found";
    }

    return tags
      .map((tag) => {
        const tagData = [
          `## ${tag.tagName}`,
          `${tag.tagDescription}`,
          "",
          `### Category`,
          tag.categoryName,
          `### Sub Category`,
          tag.categorySubName,
          `### Category source link`,
          tag.categoryLink,
          `### Tag source link`,
          tag.tagLink || "No tag source provided",
        ];
        return tagData.join("\n");
      })
      .join("\n\n");
  }
}
