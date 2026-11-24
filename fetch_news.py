# Reads football RSS feeds and saves the headlines into data/news.json
import json
import re
import os
import ssl
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

# ----- NEWS WEBSITES (RSS feeds). Add or remove lines here. -----
FEEDS = [
    ("BBC Sport", "https://feeds.bbci.co.uk/sport/football/rss.xml"),
    ("Sky Sports", "https://www.skysports.com/rss/11095"),
    ("The Guardian", "https://www.theguardian.com/football/rss"),
    ("ESPN", "https://www.espn.com/espn/rss/soccer/news"),
]

# Headlines with these words go to the International section
INTERNATIONAL_WORDS = ["world cup", "nations league", "international", "qualifier",
                       "qualifying", "euro 20", "copa america", "national team", "afcon"]

# Headlines with these words are shown first (your priority list. Edit it!)
PRIORITY_WORDS = [
    # Superstars
    "messi", "ronaldo", "neymar", "mbappe", "mbappé", "haaland", "salah",
    "bellingham", "vinicius", "yamal", "kane", "de bruyne", "lewandowski",
    "modric", "benzema", "saka", "pedri", "rodri", "son heung-min",

    # Big competitions and events
    "world cup", "champions league", "europa league", "nations league",
    "club world cup", "copa america", "afcon", "ballon d'or", "golden boot",
    "el clasico", "el clásico", "derby", "semi-final", "semifinal",
    "quarter-final", "relegation", "title race",

    # Transfers
    "here we go", "transfer", "release clause", "contract extension",
    "medical", "bid for", "loan deal", "free agent", "agreed a deal",

    # Drama and off the field
    "sacked", "resigns", "new manager", "appointed", "red card",
    "suspended", "banned", "injury", "injured", "controversy",
    "investigation", "fined", "fifa", "uefa", "breaking",

    # Big clubs
    "real madrid", "barcelona", "manchester united", "man united",
    "manchester city", "man city", "liverpool", "arsenal", "chelsea",
    "bayern", "psg", "juventus", "inter miami", "al nassr", "al hilal",
]


def clean(text):
    """Removes HTML tags and shortens the text."""
    text = re.sub(r"<[^>]+>", "", text or "").strip()
    return text[:160] + ("..." if len(text) > 160 else "")


def get_image(item):
    """Finds a photo link for the story, or returns an empty text."""
    # First choice: a thumbnail
    for child in item.iter():
        if child.tag.split("}")[-1] == "thumbnail" and child.get("url"):
            return child.get("url")
    # Second choice: an enclosure or content picture
    for child in item.iter():
        tag = child.tag.split("}")[-1]
        url = child.get("url") or ""
        if tag == "enclosure" and url and "image" in (child.get("type") or "image"):
            return url
        if tag == "content" and url and "image" in (child.get("type") or ""):
            return url
    # Last try: an <img> tag inside the description
    match = re.search(r'<img[^>]+src=["\']([^"\']+)', item.findtext("description") or "")
    return match.group(1) if match else ""


def get_time(text):
    """Turns a date text into a number so we can sort newest first."""
    try:
        return parsedate_to_datetime(text).timestamp()
    except Exception:
        return 0


def parse_feed(xml_bytes, source):
    """Turns one RSS feed into a list of headlines."""
    items = []
    root = ET.fromstring(xml_bytes)
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not title or not link:
            continue
        items.append({
            "title": title,
            "summary": clean(item.findtext("description")),
            "link": link,
            "image": get_image(item),
            "source": source,
            "time": get_time(item.findtext("pubDate") or ""),
        })
    return items


def download(url):
    try:
        import certifi
        context = ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        context = ssl.create_default_context()
    request = urllib.request.Request(url, headers={"User-Agent": "KickoffDaily/1.0"})
    with urllib.request.urlopen(request, timeout=20, context=context) as response:
        return response.read()


def sort_items(items):
    """Priority headlines first, then newest first."""
    def key(item):
        text = (item["title"] + " " + item["summary"]).lower()
        priority = any(word in text for word in PRIORITY_WORDS)
        return (not priority, -item.get("time", 0))
    return sorted(items, key=key)


def main():
    all_items = []
    seen = set()

    for source, url in FEEDS:
        try:
            for item in parse_feed(download(url), source):
                if item["link"] not in seen:
                    seen.add(item["link"])
                    all_items.append(item)
        except Exception as error:
            print("Could not read", source, ":", error)

    if not all_items:
        print("No news fetched, keeping the old file.")
        return

    international = []
    club = []
    for item in all_items:
        text = item["title"].lower()
        if any(word in text for word in INTERNATIONAL_WORDS):
            international.append(item)
        else:
            club.append(item)

    data = {
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "latest": sort_items(all_items)[:16],
        "international": sort_items(international)[:16],
        "club": sort_items(club)[:16],
        "creators": [],
    }

    os.makedirs("data", exist_ok=True)
    with open("data/news.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Saved", len(all_items), "headlines to data/news.json")


if __name__ == "__main__":
    main()
