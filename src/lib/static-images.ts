/** Bundled images in public/images — work offline and on GitHub Pages */
const base = import.meta.env.BASE_URL;

function asset(path: string): string {
  return `${base}${path.replace(/^\//, '')}`;
}

export const STATIC_PLACE_IMAGES: Record<string, string> = {
  'Jubbah Petroglyphs': asset('images/places/jubbah_petroglyphs.jpg'),
  'Qasr Zaabal': asset('images/places/qasr_zaabal.jpg'),
  'Aja Mountain': asset('images/places/aja_mountain.jpg'),
  'Harrat Khaybar': asset('images/places/harrat_khaybar.jpg'),
  'Al-Qishlah Palace': asset('images/places/al_qishlah_palace.jpg'),
  'Salma Mountain': asset('images/places/salma_mountain.jpg'),
};

export const STATIC_EVENT_IMAGES: Record<string, string> = {
  'Hail International Camel Race': asset('images/events/hail_international_camel_race.jpg'),
  'Hail Heritage Festival': asset('images/events/hail_heritage_festival.jpg'),
  'Desert Rose Season': asset('images/events/desert_rose_season.jpg'),
};

export const HERO_IMAGE = STATIC_PLACE_IMAGES['Jubbah Petroglyphs'];
