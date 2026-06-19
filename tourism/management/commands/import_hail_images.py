from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from events.models import Event
from tourism.models import TouristPlace

# Authentic Hail-region images (Wikimedia Commons) stored under media/
PLACE_IMAGES = {
    'Jubbah Petroglyphs': 'jubbah_petroglyphs.jpg',
    'Qasr Zaabal': 'qasr_zaabal.jpg',
    'Aja Mountain': 'aja_mountain.jpg',
    'Harrat Khaybar': 'harrat_khaybar.jpg',
    'Al-Qishlah Palace': 'al_qishlah_palace.jpg',
    'Salma Mountain': 'salma_mountain.jpg',
}

EVENT_IMAGES = {
    'Hail International Camel Race': 'hail_international_camel_race.jpg',
    'Hail Heritage Festival': 'hail_heritage_festival.jpg',
    'Desert Rose Season': 'desert_rose_season.jpg',
}

MIN_BYTES = 8000


class Command(BaseCommand):
    help = 'Attach verified Hail tourism images from media/ to places and events'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Replace existing images even when already set',
        )

    def handle(self, *args, **options):
        force = options['force']
        places_dir = Path(settings.MEDIA_ROOT) / 'tourist_places'
        events_dir = Path(settings.MEDIA_ROOT) / 'events'
        updated = 0

        for name_en, filename in PLACE_IMAGES.items():
            path = places_dir / filename
            if not path.exists() or path.stat().st_size < MIN_BYTES:
                self.stdout.write(self.style.WARNING(f'Missing image file: {path}'))
                continue
            try:
                place = TouristPlace.objects.get(name_en=name_en)
            except TouristPlace.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Place not found: {name_en}'))
                continue
            if place.image and not force:
                self.stdout.write(f'Skip (has image): {name_en}')
                continue
            with path.open('rb') as handle:
                place.image.save(filename, File(handle), save=True)
            updated += 1
            self.stdout.write(self.style.SUCCESS(f'Place image: {name_en}'))

        for title_en, filename in EVENT_IMAGES.items():
            path = events_dir / filename
            if not path.exists() or path.stat().st_size < MIN_BYTES:
                self.stdout.write(self.style.WARNING(f'Missing image file: {path}'))
                continue
            try:
                event = Event.objects.get(title_en=title_en)
            except Event.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Event not found: {title_en}'))
                continue
            if event.image and not force:
                self.stdout.write(f'Skip (has image): {title_en}')
                continue
            with path.open('rb') as handle:
                event.image.save(filename, File(handle), save=True)
            updated += 1
            self.stdout.write(self.style.SUCCESS(f'Event image: {title_en}'))

        self.stdout.write(self.style.SUCCESS(f'Updated {updated} image(s).'))
