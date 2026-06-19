"""Discover Wikipedia/Commons images for Hail places."""
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

HEADERS = {'User-Agent': 'JadahHailTourism/1.0'}
ROOT = Path(__file__).resolve().parents[1]
PLACES = ROOT / 'media' / 'tourist_places'
EVENTS = ROOT / 'media' / 'events'


def parse_wiki_images(page: str) -> list[str]:
    t = urllib.parse.quote(page)
    url = f'https://en.wikipedia.org/w/api.php?action=parse&page={t}&prop=text&format=json'
    req = urllib.request.Request(url, headers=HEADERS)
    html = json.loads(urllib.request.urlopen(req, timeout=30).read())['parse']['text']['*']
    return re.findall(
        r'https://upload\.wikimedia\.org/wikipedia/commons/[^"\s<>]+?\.(?:jpg|jpeg|png)',
        html,
        flags=re.I,
    )


def download(url: str, dest: Path) -> bool:
    req = urllib.request.Request(url, headers=HEADERS)
    data = urllib.request.urlopen(req, timeout=60).read()
    if len(data) < 8000:
        return False
    dest.write_bytes(data)
    return True


def to_full(url: str) -> str:
    if '/thumb/' not in url:
        return url
    # https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/File.jpg/1280px-File.jpg
    parts = url.split('/thumb/')[1].split('/')
    return f'https://upload.wikimedia.org/wikipedia/commons/{parts[0]}/{parts[1]}'


ASSIGNMENTS = {
    'jubbah_petroglyphs.jpg': [
        'Rock_Art_in_the_Hail_Region',
        'Jubbah,_Saudi_Arabia',
    ],
    'qasr_zaabal.jpg': [
        'Ha%27il',
        'Ha%27il_Region',
    ],
    'aja_mountain.jpg': [
        'Ha%27il_Region',
        'Ha%27il',
    ],
    'salma_mountain.jpg': [
        'Ha%27il_Region',
    ],
    'hail_international_camel_race.jpg': [
        'Camel_racing',
    ],
}


def pick_best(urls: list[str], keywords: list[str]) -> str | None:
    scored = []
    for url in urls:
        low = url.lower()
        score = sum(1 for k in keywords if k in low)
        if '/thumb/' in low:
            score -= 0.1
        scored.append((score, url))
    scored.sort(reverse=True)
    return scored[0][1] if scored and scored[0][0] > 0 else (urls[0] if urls else None)


def main() -> None:
    PLACES.mkdir(parents=True, exist_ok=True)
    EVENTS.mkdir(parents=True, exist_ok=True)

    keyword_map = {
        'jubbah_petroglyphs.jpg': ['rock', 'petroglyph', 'jubbah', 'art', 'hail'],
        'qasr_zaabal.jpg': ['zaabal', 'zabal', 'fort', 'castle', 'qasr', 'hail'],
        'aja_mountain.jpg': ['aja', 'mountain', 'jabal', 'granite', 'hail'],
        'salma_mountain.jpg': ['salma', 'samra', 'mountain', 'jabal', 'hail'],
        'hail_international_camel_race.jpg': ['camel', 'race', 'racing', 'saudi'],
    }

    for filename, pages in ASSIGNMENTS.items():
        dest = (PLACES if 'camel' not in filename else EVENTS) / filename
        all_urls: list[str] = []
        for page in pages:
            time.sleep(5)
            try:
                imgs = parse_wiki_images(page)
                print(page, '->', len(imgs), 'images')
                all_urls.extend(imgs)
            except Exception as exc:
                print(page, 'ERR', exc)

        keywords = keyword_map[filename]
        chosen = pick_best(all_urls, keywords)
        if not chosen:
            print('SKIP', filename, 'no images')
            continue
        full = to_full(chosen)
        print('PICK', filename, full[:100])
        time.sleep(4)
        ok = download(full, dest)
        print('SAVE', filename, ok, dest.stat().st_size if dest.exists() else 0)


if __name__ == '__main__':
    main()
