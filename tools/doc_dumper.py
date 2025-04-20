from typing import List, Dict, Set, Any
import lxml.html
import requests
import json
import os
from urllib.parse import urldefrag
from time import sleep


def fetch_page(url: str) -> str:
    """
    指定されたURLからHTMLコンテンツを取得する関数
    Args:
        url (str): 取得するURL
    Returns:
        str: 取得したHTMLコンテンツ
    """
    response = requests.get(url)
    response.raise_for_status()  # ステータスコードが200以外の場合は例外を発生させる
    return response.text


def extract_link_list(
    html_content: str,
    base_path: str = "https://reference.makeshop.jp/creator-mode/contents",
) -> List[Dict[str, str]]:
    """
    指定されたHTMLからリンク情報を抽出し、重複を除去して返す関数
    Args:
        html_content (str): HTMLコンテンツ
    Returns:
        重複を除去したリンク情報のリスト
    """
    # HTMLの解析
    tree = lxml.html.fromstring(html_content)
    # XPathを使用してリンク要素を取得
    link_elems = tree.xpath('//li[@class="toggle"]/details/ul/li/a')
    # リンクのhref属性とテキストコンテンツを抽出
    link_href: List[str] = [element.get("href") for element in link_elems]
    link_text: List[str] = [element.text_content() for element in link_elems]
    # リンク情報を辞書のリストとして構築
    link_data: List[Dict[str, str]] = [
        {"name": name, "link": link} for name, link in zip(link_text, link_href)
    ]

    # 重複を除去する処理
    link_data_unique: List[Dict[str, str]] = []
    seen_urls: Set[str] = set()
    for item in link_data:
        # URLからハッシュ部分を削除
        base_url, _ = urldefrag(item["link"])
        # 既に処理済みのURLでなければ追加
        if base_url not in seen_urls:
            seen_urls.add(base_url)
            link_data_unique.append({"name": item["name"], "link": base_url})

    # ユニークなページ名を取得
    link_title_elems = tree.xpath('//li[@class="toggle"]/details/summary')
    link_title: List[str] = [
        element.text_content().strip() for element in link_title_elems
    ]
    # リンクをリマップする処理
    link_data_remapped: List[Dict[str, str]] = []
    for idx, item in enumerate(link_data_unique):
        # リンクが相対パスの場合、ベースパスを追加
        if item["link"].startswith("../"):
            item["link"] = base_path + item["link"].lstrip("..")
        # リンクにページ名を追加 (ダサい整形処理だが"はじめに"の4ページだけ異なるアドレスを持っているためやむを得ない)
        if not ("introduction" in item["link"]):
            item["name"] = (
                link_title[idx - 3] if idx - 3 < len(link_title) else item["name"]
            )
        link_data_remapped.append(item)
    return link_data_remapped


def extract_tags_from_table(
    html_content: str,
    base_path: str = "https://reference.makeshop.jp/creator-mode/contents",
) -> Dict[str, List[Dict[str, Any]]]:
    """
    特定のHTMLテーブル構造をカテゴリ分けされたJSON形式のPython辞書に変換します。
    期待するHTML構造: (table要素内に<tbody>があり、<tr>要素がカテゴリ行とデータ行を含む)
    Args:
        html_content: 変換対象のHTML文字列。
    Returns:
        カテゴリ名をキー、対応するデータ行（辞書のリスト）を値とするPython辞書。
        <tbody>要素が見つからない場合や、期待する形式のデータ行がない場合は、
        空のカテゴリや空のリストが含まれる可能性があります。
        パースエラーが発生した場合は、例外を出力し空の辞書を返します。
        各データ行の辞書は以下のキーを持ちます:
        - 'tag': str (td要素のテキストコンテンツ)
        - 'description': str (tag-descriptionクラスを持つtd要素のテキストコンテンツ)
        - 'link': str or None (td内のaタグのhref属性。aタグがない場合はNone)
    """
    result: Dict[str, List[Dict[str, Any]]] = {}
    current_category: str | None = None  # Python 3.10+ Union[str, None]

    try:
        # HTMLをパース
        # fromstringはバイト列も受け付けるが、ここでは文字列を想定
        root = lxml.html.fromstring(html_content)

        # tbody要素を取得 (存在しない場合も考慮)
        tbody = root.find(".//tbody")

        # tbodyが見つからない場合は処理をスキップし、空の辞書を返す
        if tbody is None:
            print("Warning: <tbody> element not found in the provided HTML.")
            return result

        # tbody内のすべてのtr要素を取得
        # XPath './tr' は現在の要素(tbody)の直下の子要素であるtrを選択
        tr_elements = tbody.xpath("./tr")

        # 各tr要素を順番に処理
        for tr in tr_elements:
            # trの中に<th colspan="2">要素があるか確認（カテゴリ行の判定）
            # find()は最初に見つかった要素を返します
            th_element = tr.find('.//th[@colspan="2"]')

            if th_element is not None:
                # カテゴリ行の場合
                # thのテキストコンテンツを取得し、余分な空白を除去
                category_name = th_element.text_content().strip()
                if (
                    category_name
                ):  # カテゴリ名が空文字列でない場合のみ有効なカテゴリとする
                    current_category = category_name
                    # 結果辞書に新しいカテゴリ名のキーを追加し、値として空のリストを割り当て
                    # 同じカテゴリ名が再度出現した場合、既存のリストが上書きされます
                    result[current_category] = []
                else:
                    # カテゴリ名が空の場合は現在のカテゴリをリセット（次のデータ行が属さなくなる）
                    current_category = None

            else:
                # カテゴリ行でない場合、データ行の可能性がある
                # trの中に<td>要素が複数あるか確認
                # findall()はマッチするすべての要素をリストで返します
                td_elements = tr.findall(".//td")

                # tdが少なくとも2つある行をデータ行として処理
                if len(td_elements) >= 2:
                    # 現在のカテゴリが設定されていることを確認してからデータを追加
                    if current_category is not None:
                        tag_cell = td_elements[0]  # 1番目のtd要素
                        description_cell = td_elements[1]  # 2番目のtd要素

                        # タグ名の取得 (td要素全体のテキストを取得し整形)
                        tag = tag_cell.text_content().strip()

                        # 説明とリンクの取得
                        # descriptionはtd要素全体のテキストを取得し整形
                        description = description_cell.text_content().strip()

                        # description_cellの中からa要素を探す
                        link_element = description_cell.find(".//a")
                        # a要素があればhref属性を取得、なければNone
                        link = (
                            link_element.get("href")
                            if link_element is not None
                            else None
                        )

                        # 抽出したデータを辞書としてまとめ、現在のカテゴリのリストに追加
                        result[current_category].append(
                            {
                                "tag": tag,
                                "description": description,
                                "link": (
                                    base_path + link.lstrip("..")
                                    if link is not None and link.startswith("../")
                                    else link
                                ),
                            }
                        )
                    # else: # カテゴリ行の前にデータ行がある場合などは無視される

    except Exception as e:
        # パース中や処理中にエラーが発生した場合
        print(f"An error occurred during HTML parsing or processing: {e}")
        # エラー発生時は空の辞書を返すか、必要に応じて例外を再raiseすることも検討
        return {}  # 今回はエラー時も空の辞書を返す仕様とする

    return result


def extract_code_and_output_from_html(html_content: str) -> Dict[str, str | None]:
    """
    特定のHTML構造からサンプルコードとHTML出力イメージを抽出し、辞書として返します
    期待するHTML構造内のパターン:
    <h3>サンプルコード</h3>
    <div class="code-ex docs">
        <pre><code>...コード内容...</code></pre>
    </div>
    <h3>HTML出力イメージ</h3>
    <div class="code-ex docs">
        <pre><code>...HTML出力内容...</code></pre>
    </div>
    Args:
        html_content: 解析対象のHTML文字列。
    Returns:
        サンプルコードとHTML出力イメージを含むJSON形式の文字列。
        要素が見つからない場合は、対応するキーの値はNoneになります。
        パースエラーが発生した場合は、エラーメッセージを出力し、空のJSONオブジェクト文字列を返します。
    """
    result = {"sample_code": None, "html_output_image": None}

    try:
        # HTMLをパース
        root = lxml.html.fromstring(html_content)

        # --- サンプルコードの抽出 ---
        # "サンプルコード"というテキストを持つh3要素を探し、
        # その直後の兄弟要素でclass="code-ex docs"を持つ最初のdiv要素を取得
        # XPathの説明:
        # //h3[text()="サンプルコード"] : ドキュメント中のどこかにある、テキストが"サンプルコード"である全てのh3要素
        # /following-sibling::div[@class="code-ex docs"] :
        # そのh3要素の後に続く兄弟要素の中で、divタグかつclass="code-ex docs"を持つもの全て
        # [1] : その中の最初の要素を選択 (XPathのインデックスは1から始まります)
        sample_code_div = root.xpath(
            '//h3[text()="サンプルコード"]/following-sibling::div[@class="code-ex docs"][1]'
        )

        # もし該当するdivが見つかれば、その中の<pre><code>要素からテキストを抽出
        if sample_code_div:
            # 見つかったdiv要素 (sample_code_div[0]) の中からpre/code要素を探す
            code_element = sample_code_div[0].find(".//pre/code")
            if code_element is not None:
                # text_content()で要素内の全てのテキストノードを結合した文字列を取得
                result["sample_code"] = code_element.text_content()

        # --- HTML出力イメージの抽出 ---
        # "HTML出力イメージ"というテキストを持つh3要素を探し、同様に処理
        output_image_div = root.xpath(
            '//h3[text()="HTML出力イメージ"]/following-sibling::div[@class="code-ex docs"][1]'
        )
        # もし該当するdivが見つかれば、その中の<pre><code>要素からテキストを抽出
        if output_image_div:
            # 見つかったdiv要素 (output_image_div[0]) の中からpre/code要素を探す
            code_element = output_image_div[0].find(".//pre/code")
            if code_element is not None:
                result["html_output_image"] = code_element.text_content()
    except Exception as e:
        # パースエラーなどが発生した場合
        print(f"An error occurred during HTML parsing or processing: {e}")
        # エラー時は空のJSONオブジェクトを返す
    return result


if __name__ == "__main__":
    base_path = "https://reference.makeshop.jp/creator-mode/contents"
    target_url = base_path + "/introduction/about.html"
    category_html_content = fetch_page(target_url)

    os.makedirs("separated/tags", exist_ok=True)
    os.makedirs("combined", exist_ok=True)

    out = []
    # ページ一覧を出力
    pages = extract_link_list(category_html_content, base_path)
    for page in pages:
        print(f"Processing {page['name']}...")
        tag_html_content = fetch_page(page["link"])
        # タグ情報を出力
        tags = extract_tags_from_table(tag_html_content, base_path)
        # タグのサンプルがあれば、サンプルコードとHTML出力イメージを抽出
        if len(tags.keys()) > 0:
            print(f"  Found {len(tags.keys())} tags.")
            for key in tags.keys():
                # サンプルコードとHTML出力イメージを抽出
                for i in range(len(tags[key])):
                    print(f"Processing {tags[key][i]['tag']}...")
                    # リンクがない場合はスキップ
                    if tags[key][i]["link"] is None:
                        continue
                    try:
                        example_html_content = fetch_page(tags[key][i]["link"])
                    except Exception as e:
                        print(f"Error fetching {tags[key][i]['link']}: {e}")
                        continue
                    sample_code_info = extract_code_and_output_from_html(
                        example_html_content
                    )
                    # タグ情報に追加
                    tags[key][i].update({**tags[key][i], **sample_code_info})
                    sleep(2)
        out.append({**page, "tags": tags})
        # タグ情報単体を出力
        # tag_filename = page["link"].split("/")[-2] + ".json"
        # with open("separated/tags/" + tag_filename, "w", encoding="utf-8") as f:
        #     json.dump(tags, f, ensure_ascii=False, indent=2)
        sleep(2)
    # # ページ一覧単体を出力
    # with open("separated/pages.json", "w", encoding="utf-8") as f:
    #     for i in range(len(pages)):
    #         # リンクにファイル名を追加 (ダサい整形処理だが"はじめに"の4ページだけ異なるアドレスを持っているためやむを得ない)
    #         if not ("introduction" in pages[i]["link"]):
    #             pages[i]["filename"] = pages[i]["link"].split("/")[-2] + ".json"
    #         else:
    #             pages[i]["filename"] = None
    #     json.dump(pages, f, ensure_ascii=False, indent=2)

    # 全てをまとめた結果を出力
    with open("../src/output.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
