from django.core.management.base import BaseCommand
from django.utils import timezone

from events.models import Event
from tourism.models import Review, TouristPlace, TouristRoute


PLACES = [
    {
        'name_ar': 'نقوش جبيل الحائر',
        'name_en': 'Jubbah Petroglyphs',
        'description': 'UNESCO World Heritage site at Jubbah featuring rock art dating back 10,000 years.',
        'category': 'historical',
        'latitude': 28.03,
        'longitude': 40.92,
        'visiting_hours': '7:00 – 19:00',
    },
    {
        'name_ar': 'قصر زعبل',
        'name_en': 'Qasr Zaabal',
        'description': 'Ancient fortress perched atop a volcanic rock formation rising above Hail city.',
        'category': 'historical',
        'latitude': 27.54,
        'longitude': 41.71,
        'visiting_hours': '8:00 – 18:00',
    },
    {
        'name_ar': 'جبل أجا',
        'name_en': 'Aja Mountain',
        'description': 'Iconic granite massif within Hail city with hiking trails and panoramic views.',
        'category': 'natural',
        'latitude': 27.56,
        'longitude': 41.62,
        'visiting_hours': 'Open 24h',
    },
    {
        'name_ar': 'حرة خيبر',
        'name_en': 'Harrat Khaybar',
        'description': 'One of the largest volcanic fields with dramatic basalt lava flows.',
        'category': 'natural',
        'latitude': 25.70,
        'longitude': 39.90,
        'visiting_hours': 'Daylight only',
    },
    {
        'name_ar': 'قصر القشلة',
        'name_en': 'Al-Qishlah Palace',
        'description': 'Regional heritage museum housing traditional Hail artifacts and manuscripts.',
        'category': 'cultural',
        'latitude': 27.51,
        'longitude': 41.68,
        'visiting_hours': '9:00 – 17:00',
    },
    {
        'name_ar': 'جبل سلمى',
        'name_en': 'Salma Mountain',
        'description': 'Sister peak to Aja Mountain with granite ridges and desert panoramas.',
        'category': 'natural',
        'latitude': 27.60,
        'longitude': 41.50,
        'visiting_hours': 'Open 24h',
    },
]

EVENTS = [
    {
        'title_ar': 'سباق الهجن الدولي بحائل',
        'title_en': 'Hail International Camel Race',
        'description': 'Annual camel racing festival attracting visitors from across the region.',
        'location': 'Camel Racing Track, Hail',
        'start_offset_days': 14,
        'end_offset_days': 20,
    },
    {
        'title_ar': 'مهرجان التراث الحائلي',
        'title_en': 'Hail Heritage Festival',
        'description': 'Celebration of Hail heritage with crafts, music, and traditional food.',
        'location': 'Al-Qishlah Palace',
        'start_offset_days': 35,
        'end_offset_days': 45,
    },
    {
        'title_ar': 'موسم وردة الصحراء',
        'title_en': 'Desert Rose Season',
        'description': 'Spring cultural season at Aja Mountain with outdoor activities.',
        'location': 'Aja Mountain',
        'start_offset_days': 60,
        'end_offset_days': 70,
    },
]

ROUTES = [
    {
        'name': 'Heritage Trail',
        'description': 'A full-day route covering Hail\'s most iconic heritage landmarks.',
        'duration': 'Full day',
        'difficulty': 'easy',
        'place_names': ['Jubbah Petroglyphs', 'Qasr Zaabal', 'Al-Qishlah Palace'],
    },
    {
        'name': 'Nature Explorer',
        'description': 'Two-day itinerary through Hail\'s natural wonders.',
        'duration': '2 days',
        'difficulty': 'moderate',
        'place_names': ['Aja Mountain', 'Salma Mountain', 'Harrat Khaybar'],
    },
    {
        'name': 'Ancient Kingdoms',
        'description': 'Extended route linking historical and volcanic sites.',
        'duration': '3 days',
        'difficulty': 'hard',
        'place_names': ['Jubbah Petroglyphs', 'Qasr Zaabal', 'Aja Mountain', 'Harrat Khaybar'],
    },
]


class Command(BaseCommand):
    help = 'Load demo tourism data matching the Figma design content'

    def handle(self, *args, **options):
        if TouristPlace.objects.exists():
            self.stdout.write(self.style.WARNING('Demo data already exists. Skipping.'))
            return

        places_by_name = {}
        for data in PLACES:
            place = TouristPlace.objects.create(**data)
            places_by_name[place.name_en] = place

        now = timezone.now()
        for data in EVENTS:
            Event.objects.create(
                title_ar=data['title_ar'],
                title_en=data['title_en'],
                description=data['description'],
                location=data['location'],
                start_date=now + timezone.timedelta(days=data['start_offset_days']),
                end_date=now + timezone.timedelta(days=data['end_offset_days']),
            )

        for data in ROUTES:
            route = TouristRoute.objects.create(
                name=data['name'],
                description=data['description'],
                duration=data['duration'],
                difficulty=data['difficulty'],
            )
            route.places.set([places_by_name[name] for name in data['place_names']])

        self.stdout.write(self.style.SUCCESS(
            f'Created {len(places_by_name)} places, {len(EVENTS)} events, and {len(ROUTES)} routes.',
        ))
