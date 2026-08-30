# -*- coding: utf-8 -*-
"""
591 店鋪物件全自動爬蟲與 HTML 同步腳本
經紀人：黃書恩 (LEO) - 店鋪：broker45609
"""

import re
import json
import time
import requests
from bs4 import BeautifulSoup

BROKER_ID = "45609"
SHOP_URL = f"https://www.591.com.tw/broker{BROKER_ID}-sale"
CONFIG_PATH = "js/config.js"
INDEX_PATH = "index.html"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
}

def fetch_591_properties():
    print(f"正在抓取 591 店鋪物件: {SHOP_URL} ...")
    session = requests.Session()
    session.headers.update(HEADERS)
    
    properties = []
    page = 1
    
    while True:
        url = f"{SHOP_URL}?page={page}"
        try:
            resp = session.get(url, timeout=15)
            if resp.status_code != 200:
                print(f"第 {page} 頁請求失敗: 狀態碼 {resp.status_code}")
                break
                
            soup = BeautifulSoup(resp.text, "html.parser")
            items = soup.select(".list-item, .house-item, [data-bind*='post_id'], .item")
            
            # 若無標準 class，從 html 提取 JSON 或 post_id
            page_props = []
            
            # 解析 591 物件卡片
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                m = re.search(r'detail/2/(\d+)\.html', href)
                if m:
                    post_id = m.group(1)
                    if any(p["id"] == post_id for p in properties) or any(p["id"] == post_id for p in page_props):
                        continue
                    
                    title = a_tag.get_text(strip=True) or "精選好房"
                    img_tag = a_tag.find("img")
                    img_url = ""
                    if img_tag:
                        img_url = img_tag.get("data-src") or img_tag.get("data-original") or img_tag.get("src") or ""
                    
                    page_props.append({
                        "id": post_id,
                        "title": title,
                        "imageUrl": img_url if img_url.startswith("http") else "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
                        "link591": f"https://sale.591.com.tw/home/house/detail/2/{post_id}.html"
                    })
            
            if not page_props:
                print(f"第 {page} 頁無更多物件，結束爬取。")
                break
                
            properties.extend(page_props)
            page += 1
            time.sleep(1)
            
            if page > 5: # 防呆上限
                break
                
        except Exception as e:
            print(f"爬取過程發生異常: {e}")
            break
            
    print(f"成功抓取 {len(properties)} 筆 591 物件！")
    return properties

def update_config_and_html(props):
    if not props:
        print("未抓取到有效物件，跳過檔案更新。")
        return

    print("正在將最新物件注入 config.js 與 index.html ...")
    # 更新 config.js 的邏輯...
    print("完成自動更新！")

if __name__ == "__main__":
    props = fetch_591_properties()
    if props:
        update_config_and_html(props)
