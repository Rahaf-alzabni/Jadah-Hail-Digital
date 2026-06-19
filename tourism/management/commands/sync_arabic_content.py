from django.core.management.base import BaseCommand

from events.models import Event
from tourism.models import TouristPlace, TouristRoute

PLACE_AR = {
    'Jubbah Petroglyphs': {
        'description_ar': (
            'موقع تراث عالمي لليونسكو في جبيل يضم منحوتات صخرية تعود لآلاف السنين، '
            'محفورة في جدران الحجر الرملي وتصوّر الحياة البشرية والحيوانية القديمة.'
        ),
        'visiting_hours_ar': '٧:٠٠ – ١٩:٠٠',
    },
    'Qasr Zaabal': {
        'description_ar': (
            'قلعة قديمة تعلو تشكيلاً بركانياً فوق مدينة حائل، مقرّ الأسرة الرشيدية، '
            'تطل على السهول المحيطة من جميع الاتجاهات.'
        ),
        'visiting_hours_ar': '٨:٠٠ – ١٨:٠٠',
    },
    'Aja Mountain': {
        'description_ar': (
            'كتلة جرانيتية أيقونية داخل مدينة حائل، إحدى جبلَي طيء الأسطوريين، '
            'تزخر بالنقوش القديمة ومسارات المشي ومناظر المدينة البانورامية.'
        ),
        'visiting_hours_ar': 'مفتوح على مدار الساعة',
    },
    'Harrat Khaybar': {
        'description_ar': (
            'أحد أكبر الحقول البركانية النشطة، يمتد بتدفقاته البازلتية السوداء '
            'ومخاريط الرماد وكهوف الأنابيب البركانية النادرة.'
        ),
        'visiting_hours_ar': 'خلال ساعات النهار',
    },
    'Al-Qishlah Palace': {
        'description_ar': (
            'بُني عام ١٨١٢م كثكنة عسكرية، ويضم اليوم آلاف المقتنيات والأسلحة التقليدية '
            'والعملات والمخطوطات النادرة.'
        ),
        'visiting_hours_ar': '٩:٠٠ – ١٧:٠٠',
    },
    'Salma Mountain': {
        'description_ar': (
            'قمة شقيقة لجبل أجا في ثنائي طيء الخالد بالشعر العربي، '
            'تتميز بحوافها الجرانيتية وبانوراما الصحراء الشاسعة.'
        ),
        'visiting_hours_ar': 'مفتوح على مدار الساعة',
    },
}

EVENT_AR = {
    'Hail International Camel Race': {
        'description_ar': 'سباق الهجن الدولي السنوي الذي يجذب الزوار من مختلف مناطق المملكة.',
        'location_ar': 'ميدان الهجن، حائل',
    },
    'Hail Heritage Festival': {
        'description_ar': 'مهرجان يحتفي بالتراث الحائلي من الحِرف والموسيقى والمأكولات الشعبية.',
        'location_ar': 'قصر القشلة، حائل',
    },
    'Desert Rose Season': {
        'description_ar': 'موسم ثقافي وطبيعي عند جبل أجا بأنشطة متنوعة في الهواء الطلق.',
        'location_ar': 'جبل أجا، حائل',
    },
}

ROUTE_AR = {
    'Heritage Trail': {
        'name_ar': 'درب التراث',
        'description_ar': 'مسار يومي سهل يغطي أبرز معالم التراث في حائل ومحيطها.',
    },
    'Nature Explorer': {
        'name_ar': 'مستكشف الطبيعة',
        'description_ar': 'رحلة ليومين لاستكشاف جمال الطبيعة والمعالم الطبيعية في المنطقة.',
    },
    'Ancient Kingdoms': {
        'name_ar': 'الممالك القديمة',
        'description_ar': 'مسار لمدة ثلاثة أيام يربط المواقع التاريخية والبركانية البعيدة.',
    },
}


class Command(BaseCommand):
    help = 'Fill Arabic content fields for existing tourism data'

    def handle(self, *args, **options):
        updated = 0
        for place in TouristPlace.objects.all():
            data = PLACE_AR.get(place.name_en)
            if not data:
                continue
            place.description_ar = data['description_ar']
            place.visiting_hours_ar = data['visiting_hours_ar']
            place.save(update_fields=['description_ar', 'visiting_hours_ar'])
            updated += 1

        for event in Event.objects.all():
            data = EVENT_AR.get(event.title_en)
            if not data:
                continue
            event.description_ar = data['description_ar']
            event.location_ar = data['location_ar']
            event.save(update_fields=['description_ar', 'location_ar'])
            updated += 1

        for route in TouristRoute.objects.all():
            data = ROUTE_AR.get(route.name)
            if not data:
                continue
            route.name_ar = data['name_ar']
            route.description_ar = data['description_ar']
            route.save(update_fields=['name_ar', 'description_ar'])
            updated += 1

        self.stdout.write(self.style.SUCCESS(f'Updated Arabic content for {updated} records.'))
