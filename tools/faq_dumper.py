import requests
import json
import os
import time
from markdownify import markdownify

# 設定
# Zendesk APIの初期エンドポイントURLを指定してください。
# 例: "https://[your_subdomain].zendesk.com/api/v2/help_center/[locale]/categories/[category_id]/articles.json"
# 例: "https://makeshopsupport.zendesk.com/api/v2/help_center/ja/categories/7885731770137/articles.json"
# per_pageパラメータはAPIのデフォルト（通常30）または指定したものが使われます。
# 必要であれば、URLの末尾に "?per_page=100" のように明示的に指定することも可能です。（最大100）
START_URL = "https://makeshopsupport.zendesk.com/api/v2/help_center/ja/categories/7885731770137/articles.json"

# 記事を保存するディレクトリ名
OUTPUT_DIR = "zendesk_articles"


def fetch_all_articles(start_url, output_dir):
    """
    指定されたURLからZendesk記事を全て取得し、個別のJSONファイルとして保存する

    Args:
        start_url (str): Zendesk APIの最初のページURL
        output_dir (str): 記事を保存するディレクトリ名
    """
    articles_count = 0
    current_url = start_url

    # 保存ディレクトリが存在しない場合は作成
    os.makedirs(output_dir, exist_ok=True)
    print(f"記事はディレクトリ '{output_dir}' に保存されます。")

    while current_url:
        print(f"Fetching from: {current_url}")
        try:
            response = requests.get(current_url)
            response.raise_for_status()  # 200以外のステータスコードの場合は例外を発生させる

            data = response.json()

            if not data or "articles" not in data:
                print(
                    "Error: 'articles' key not found in the response or response is empty."
                )
                break

            articles = data["articles"]

            if not articles:
                print("No articles found on this page.")
                current_url = data.get("next_page")
                continue

            for article in articles:
                article_id = article.get("id")
                article_title = article.get(
                    "title", "Untitled"
                )  # タイトルがない場合を考慮
                if "【クリエイターモード】" not in article_title:
                    print(f"Skipping article {article_id}: '{article_title}'")
                    continue

                if article_id is None:
                    print(f"Warning: Article without ID found. Skipping.")
                    continue

                filename = os.path.join(output_dir, f"article_{article_id}.md")
                file_body = markdownify("#" + article_title + "\n\n" + article["body"])

                try:
                    with open(filename, "w", encoding="utf-8") as f:
                        f.write(file_body)
                    print(
                        f"Saved article {article_id}: '{article_title}' to {filename}"
                    )
                    articles_count += 1
                except IOError as e:
                    print(f"Error saving file {filename}: {e}")

            # 次のページのURLを取得
            current_url = data.get("next_page")

            # APIレート制限に配慮して少し待つ (任意)
            time.sleep(2)

        except requests.exceptions.RequestException as e:
            print(f"Error fetching data from {current_url}: {e}")
            # エラーが発生した場合、ループを終了するか、リトライロジックを追加するか検討
            break
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from {current_url}: {e}")
            break
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            break

    print("-" * 20)
    print(
        f"記事の取得と保存が完了しました。合計 {articles_count} 件の記事を保存しました。"
    )


if __name__ == "__main__":
    # スクリプト実行時にfetch_all_articles関数を呼び出す
    fetch_all_articles(START_URL, OUTPUT_DIR)
