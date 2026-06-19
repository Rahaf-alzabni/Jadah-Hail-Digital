"""One-off helper to discover and download Hail landmark images from Wikimedia."""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

USER_AGENT = 'JadahHailTourism/1.0 (student project; educational use)'
ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / 'media' / 'tourist_places'
EVENTS = ROOT / 'media' / 'events'

PLACE_IMAGE_SOURCES = {
    'Jubbah Petroglyphs': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/ISS-64_Jubba_with_Nefud_Desert%2C_Saudi_Arabia.jpg/1280px-ISS-64_Jubba_with_Nefud_Desert%2C_Saudi_Arabia.jpg',
    ],
    'Qasr Zaabal': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Hail_City%2C_Saudi_Arabia.jpg/1280px-Hail_City%2C_Saudi_Arabia.jpg',
    ],
    'Aja Mountain': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Hail_Saudi_Arabia_Mountains.jpg/1280px-Hail_Saudi_Arabia_Mountains.jpg',
    ],
    'Harrat Khaybar': [
        'https://upload.wikimedia.org/wikipedia/commons/4/4c/%D8%AD%D8%B1%D8%A9_%D8%AE%D9%8A%D8%A8%D8%B1.jpg',
    ],
    'Al-Qishlah Palace': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Qishlah_2.jpg/1280px-Qishlah_2.jpg',
    ],
    'Salma Mountain': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Hail_Saudi_Arabia_Mountains.jpg/1280px-Hail_Saudi_Arabia_Mountains.jpg',
    ],
}

EVENT_IMAGE_SOURCES = {
    'Hail International Camel Race': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Camel_racing_%28Saudi_Arabia%29.jpg/1280px-Camel_racing_%28Saudi_Arabia%29.jpg',
    ],
    'Hail Heritage Festival': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Qishlah_2.jpg/1280px-Qishlah_2.jpg',
    ],
    'Desert Rose Season': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Hail_Saudi_Arabia_Mountains.jpg/1280px-Hail_Saudi_Arabia_Mountains.jpg',
    ],
}


def wiki_search_image(query: str) -> str | None:
    q = urllib.parse.quote(query)
    url = (
        'https://commons.wikimedia.org/w/api.php?action=query&generator=search'
        f'&gsrsearch={q}&gsrnamespace=6&gsrlimit=8&prop=imageinfo'
        '&iiprop=url|mime&iiurlwidth=1280&format=json'
    )
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    data = json.loads(urllib.request.urlopen(req, timeout=30).read())
    pages = data.get('query', {}).get('pages', {})
    for page in sorted(pages.values(), key=lambda p: p['pageid']):
        info = page.get('imageinfo', [{}])[0]
        if not str(info.get('mime', '')).startswith('image/'):
            continue
        return info.get('thumburl') or info.get('url')
    return None


def wiki_page_image(title: str) -> str | None:
    t = urllib.parse.quote(title.replace(' ', '_'))
    url = (
        f'https://en.wikipedia.org/w/api.php?action=query&titles={t}'
        '&prop=pageimages&piprop=original&format=json'
    )
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    data = json.loads(urllib.request.urlopen(req, timeout=30).read())
    for page in data.get('query', {}).get('pages', {}).values():
        return page.get('original', {}).get('source')
    return None


def wiki_page_images_from_html(title: str) -> list[str]:
    t = urllib.parse.quote(title.replace(' ', '_'))
    url = f'https://en.wikipedia.org/w/api.php?action=parse&page={t}&prop=text&format=json'
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    html = json.loads(urllib.request.urlopen(req, timeout=30).read())['parse']['text']['*']
    found = re.findall(r'https://upload\.wikimedia\.org/wikipedia/commons/[^"\s]+?\.(?:jpg|jpeg|png)', html, flags=re.I)
    # Prefer full-size over thumb
    full = [u for u in found if '/thumb/' not in u]
    thumbs = [u for u in found if '/thumb/' in u]
    return full or thumbs


def download(url: str, dest: Path) -> bool:
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    if len(data) < 5000:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return True


def resolve_place_url(name: str, candidates: list[str]) -> str | None:
    for url in candidates:
        time.sleep(3)
        try:
            req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(req, timeout=20) as resp:
                if resp.status == 200:
                    return url
        except Exception:
            continue

    wiki_queries = {
        'Jubbah Petroglyphs': ['Jubbah petroglyphs Saudi', 'Rock art Hail Saudi Arabia'],
        'Qasr Zaabal': ['Qasr Zaabal Hail', 'Zaabal castle Hail'],
        'Aja Mountain': ['Aja mountains Hail', 'Jabal Aja Hail'],
        'Harrat Khaybar': ['Harrat Khaybar', 'Khaybar volcanic field'],
        'Al-Qishlah Palace': ['Qishlah palace Hail'],
        'Salma Mountain': ['Salma mountains Hail', 'Jabal Samra Hail'],
    }
    for page in ['Rock Art in the Hail Region', 'Harrat Khaybar', 'Jubbah, Saudi Arabia']:
        time.sleep(4)
        try:
            imgs = wiki_page_images_from_html(page)
            if imgs:
                return imgs[0]
        except Exception:
            pass

    for query in wiki_queries.get(name, [name]):
        time.sleep(4)
        try:
            url = wiki_search_image(query)
            if url:
                return url
        except Exception:
            pass

    time.sleep(3)
    try:
        return wiki_page_image(name.replace(' ', '_'))
    except Exception:
        return None


def slug(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')


def main() -> None:
    MEDIA.mkdir(parents=True, exist_ok=True)
    EVENTS.mkdir(parents=True, exist_ok=True)

    for name, candidates in PLACE_IMAGE_SOURCES.items():
        dest = MEDIA / f'{slug(name)}.jpg'
        if dest.exists() and dest.stat().st_size > 5000:
            print(f'OK exists {name} -> {dest.name}')
            continue
        url = resolve_place_url(name, candidates)
        if not url:
            print(f'FAIL no URL {name}')
            continue
        time.sleep(4)
        ok = download(url, dest)
        print(f'{"OK" if ok else "FAIL"} {name} <- {url[:90]}...')

    for name, candidates in EVENT_IMAGE_SOURCES.items():
        dest = EVENTS / f'{slug(name)}.jpg'
        if dest.exists() and dest.stat().st_size > 5000:
            print(f'OK exists event {name}')
            continue
        url = resolve_place_url(name, candidates)
        if not url:
            print(f'FAIL no URL event {name}')
            continue
        time.sleep(4)
        ok = download(url, dest)
        print(f'{"OK" if ok else "FAIL"} event {name}')


if __name__ == '__main__':
    main()
