# ms-creator-mcp-server

MS クリエイターモード デザイン構築用 MCP サーバー (非公式)

## 提供ツール

- **`ms_creator_tag_categories`**
  - **説明:**
    - MS Creator タグを検索するためのカテゴリ一覧を取得します。
  - **パラメータ:**
    - なし
  - **戻り値:**
    - テキスト形式のカテゴリ一覧
- **`ms_creator_tag_sub_categories`**
  - **説明:**
    - 指定されたカテゴリ名に属するサブカテゴリの一覧を取得します。
  - **パラメータ:**
    - `categoryName` (必須): 検索したいカテゴリ名 (文字列)
  - **戻り値:**
    - テキスト形式のサブカテゴリ一覧
- **`ms_creator_tag_search_by_category`**
  - **説明:**
    - 指定されたカテゴリ名に属する MS Creator タグの一覧と説明を取得します。
  - **パラメータ:**
    - `categoryName` (必須): 検索したいカテゴリ名 (文字列)
  - **戻り値:**
    - テキスト形式のタグ情報一覧（タグ名と説明）
- **`ms_creator_tag_search_by_sub_category`**
  - **説明:**
    - 指定されたカテゴリ内のサブカテゴリに属する MS Creator タグの一覧と説明を取得します。
  - **パラメータ:**
    - `categoryName` (必須): 検索したいカテゴリ名 (文字列)
    - `subCategoryName` (必須): 検索したいサブカテゴリ名 (文字列)
  - **戻り値:**
    - テキスト形式のタグ情報一覧（タグ名と説明）
- **`ms_creator_tag_search_by_keyword`**
  - **説明:**
    - タグの説明に含まれるキーワードに基づいて、関連する MS Creator タグを検索します。
  - **パラメータ:**
    - `keyword` (必須): 検索キーワード (文字列)
  - **戻り値:**
    - テキスト形式のタグ情報一覧（タグ名と説明）
- **`ms_creator_tag_get_detail`**
  - **説明:**
    - 指定された正確なタグ名に一致する MS Creator タグの詳細情報（説明、カテゴリ、例など）を取得します。
  - **パラメータ:**
    - `tagName` (必須): 検索したい正確なタグ名 (文字列)
  - **戻り値:**
    - テキスト形式のタグ詳細情報
- **`ms_creator_tag_get_source`**
  - **説明:**
    - 指定された正確なタグ名に一致する MS Creator タグの**ソース URL**を取得します。
  - **パラメータ:**
    - `tagName` (必須): 検索したい正確なタグ名 (文字列)
  - **戻り値:**
    - テキスト形式のタグのソース URL 情報

## インストール

### 前提条件

- Node.js 20.x 以上
- Python 3.8 以上
- pip

### 手順

```
# リポジトリをコピー
git clone
# ドキュメントを作成
cd ms-creator-mcp-server/tools
pip install -r requirements.txt
python doc_dumper.py
# ビルド(Docker)
docker build -t ms-creator-mcp-server:1.0.0 .
# ビルド(Node.js 任意)
npm install
npm run build
```

### エディタへの設定例

VSCode Copilot Agent の場合

```json
{
  "mcp": {
    "servers": {
      "ms-creator-mcp-server": {
        "type": "stdio",
        "command": "docker",
        "args": ["run", "-i", "--rm", "ms-creator-mcp-server:1.0.0"]
      }
    }
  }
}
```

## ライセンス

本ソフトウェアは、MIT ライセンスの下で配布されています。

## 免責事項

本ソフトウェアは、公式な製品ではなく、個人で MCP サーバーの研究を目的に趣味で作られたものです。内容が正しいことは保証されず、使用に関しては自己責任でお願いします。本ソフトウェアを使用したことによるいかなる損害についても、作者は責任を負いません。
