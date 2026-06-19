"""Download verified Wikimedia images for Hail tourism content."""
from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

USER_AGENT = 'JadahHailTourism/1.0 (student project; educational use)'
ROOT = Path(__file__).resolve().parents[1]

# Curated Commons files — authentic Hail / Najd region imagery
CATALOG: dict[str, list[str]] = {
    'media/tourist_places/jubbah_petroglyphs.jpg': [
        'File:Petroglyph of the king, Jubbah UNESCO Site (1).jpg',
        'File:ISS-64 Jubba with Nefud Desert, Saudi Arabia.jpg',
    ],
    'media/tourist_places/qasr_zaabal.jpg': [
        'File:برزان.jpg',
    ],
    'media/tourist_places/aja_mountain.jpg': [
        'File:Alsamra.jpg',
    ],
    'media/tourist_places/harrat_khaybar.jpg': [
        'File:حرة خيبر.jpg',
    ],
    'media/tourist_places/al_qishlah_palace.jpg': [
        'File:Qishlah 2.jpg',
    ],
    'media/tourist_places/salma_mountain.jpg': [
        'File:Alsamra.jpg',
    ],
    'media/events/hail_international_camel_race.jpg': [
        'File:AI Zalaga Camel Race 006.jpg',
    ],
    'media/events/hail_heritage_festival.jpg': [
        'File:Qishlah 2.jpg',
    ],
    'media/events/desert_rose_season.jpg': [
        'File:Alsamra.jpg',
    ],
}


def commons_url(title: str) -> str | None:
    encoded = urllib.parse.quote(title.replace(' ', '_'), safe=':/')
    url = (
        f'https://commons.wikimedia.org/w/api.php?action=query&titles={encoded}'
        '&prop=imageinfo&iiprop=url&format=json'
    )
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    data = json.loads(urllib.request.urlopen(req, timeout=30).read())
    for page in data['query']['pages'].values():
        info = page.get('imageinfo')
        if info:
            return info[0]['url']
    return None


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    data = urllib.request.urlopen(req, timeout=120).read()
    if len(data) < 8000:
        raise RuntimeError(f'download too small ({len(data)} bytes)')
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)


def main() -> None:
    for rel, candidates in CATALOG.items():
        dest = ROOT / rel
        for title in candidates:
            time.sleep(4)
            try:
                url = commons_url(title)
                if not url:
                    print(f'missing: {title}')
                    continue
                print(f'{dest.name} <- {title}')
                download(url, dest)
                print(f'  saved {dest.stat().st_size // 1024} KB')
                break
            except Exception as exc:
                print(f'  fail {title}: {exc}')
        else:
            print(f'SKIPPED {dest.name}')


if __name__ == '__main__':
    main()
