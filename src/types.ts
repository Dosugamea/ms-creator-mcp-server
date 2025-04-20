export type DatabaseRawTagRecord = {
  /** タグ名 */
  tag: string;
  /** タグの説明 */
  description: string;
  /** 実装例URL */
  link: string | null;
  /** 実装例 */
  sample_code?: string;
  /** 実装例の出力サンプル */
  html_output_image?: string;
};

export type DatabaseRawCategoryRecord = {
  /** カテゴリ名 */
  name: string;
  /** 出典URL */
  link: string;
  /** 記載されたタグ一覧 */
  tags: Record<string, DatabaseRawTagRecord[]>;
};

export type DatabaseRecord = {
  /** タグ名 */
  tagName: string;
  /** カテゴリ名 */
  categoryName: string;
  /** サブカテゴリ名 */
  categorySubName: string;
  /** タグ説明 */
  tagDescription: string;
  /** カテゴリ出典 */
  categoryLink: string;
  /** タグ出典 */
  tagLink: string | null;
  /** 実装例URL */
  tagSampleCode: string | null;
  /** 実装例の出力サンプル */
  tagHtmlOutputImage: string | null;
};
