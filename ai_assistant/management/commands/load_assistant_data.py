from django.core.management.base import BaseCommand

from ai_assistant.models import AssistantFallback, AssistantReply


REPLIES = [
    {
        'prompt_ar': 'رسالة الترحيب',
        'prompt_en': 'Welcome message',
        'response_ar': (
            'مرحباً! أنا مساعدك السياحي في جادة حائل. '
            'اختر سؤالاً من الخيارات أدناه للحصول على إجابة فورية وواضحة '
            'حول المعالم والمسارات والفعاليات في منطقة حائل.'
        ),
        'response_en': (
            'Hello! I am your Jadah Hail tourism assistant. '
            'Pick a question from the options below for a clear, instant answer '
            'about attractions, routes, and events in the Hail region.'
        ),
        'category': 'general',
        'order': 0,
        'is_welcome': True,
        'keywords': [],
    },
    {
        'prompt_ar': 'أفضل وقت للزيارة',
        'prompt_en': 'Best time to visit',
        'response_ar': (
            'أفضل وقت لزيارة حائل هو من أكتوبر إلى مارس حين تكون الحرارة معتدلة (١٥–٢٥°م). '
            'للمعالم الخارجية مثل نقوش جبيل الحائر، يُفضّل الوصول صباحاً باكراً. '
            'تجنّبي فصل الصيف الحار ما أمكن.'
        ),
        'response_en': (
            'The best time to visit Hail is October through March when temperatures are mild (15–25°C). '
            'For outdoor sites like Jubbah Petroglyphs, arrive early in the morning. '
            'Avoid the hot summer months when possible.'
        ),
        'category': 'timing',
        'order': 1,
        'keywords': ['وقت', 'season', 'weather', 'october', 'march', 'زيارة'],
    },
    {
        'prompt_ar': 'مسارات للعائلات',
        'prompt_en': 'Family-friendly routes',
        'response_ar': (
            'نوصي بمسار «درب التراث» للعائلات: يوم واحد، مستوى سهل، '
            'ويشمل قصر القشلة وقصر زعبل ومعالم قريبة من وسط المدينة. '
            'أوقات الزيارة مرنة ومسارات المشي مناسبة للأطفال.'
        ),
        'response_en': (
            'We recommend the Heritage Trail for families: one full day, easy difficulty, '
            'covering Al-Qishlah Palace, Qasr Zaabal, and landmarks near the city center. '
            'Visiting hours are flexible and walking paths are suitable for children.'
        ),
        'category': 'routes',
        'order': 2,
        'keywords': ['عائلة', 'family', 'children', 'kids', 'درب التراث'],
    },
    {
        'prompt_ar': 'أبرز المعالم السياحية',
        'prompt_en': 'Top attractions',
        'response_ar': (
            'أبرز معالم حائل: نقوش جبيل الحائر (تراث عالمي)، جبل أجا وجبل سلمى، '
            'قصر زعبل، قصر القشلة، وحرة خيبر البركانية. '
            'يمكنك استكشافها جميعاً من صفحة «استكشف» في المنصة.'
        ),
        'response_en': (
            'Top Hail landmarks include Jubbah Petroglyphs (UNESCO heritage), Aja and Salma mountains, '
            'Qasr Zaabal, Al-Qishlah Palace, and Harrat Khaybar volcanic field. '
            'Explore them all from the Explore page on the platform.'
        ),
        'category': 'places',
        'order': 3,
        'keywords': ['معالم', 'attractions', 'places', 'jubbah', 'aja', 'zaabal'],
    },
    {
        'prompt_ar': 'الفعاليات القادمة',
        'prompt_en': 'Upcoming events',
        'response_ar': (
            'تُعرض الفعاليات القادمة في الصفحة الرئيسية وقسم الفعاليات، '
            'مثل سباق الهجن الدولي ومهرجان التراث الحائلي وموسم وردة الصحراء. '
            'راجع التواريخ والمواقع في بطاقات الفعاليات.'
        ),
        'response_en': (
            'Upcoming events are listed on the home page and events section, '
            'including the International Camel Race, Hail Heritage Festival, and Desert Rose Season. '
            'Check dates and locations on the event cards.'
        ),
        'category': 'events',
        'order': 4,
        'keywords': ['فعاليات', 'events', 'festival', 'مهرجان', 'سباق'],
    },
    {
        'prompt_ar': 'أفضل وقت لزيارة جبيل',
        'prompt_en': 'Best time for Jubbah',
        'response_ar': (
            'أفضل وقت لزيارة نقوش جبيل الحائر هو من أكتوبر إلى مارس. '
            'اوصل صباحاً للاستمتاع بالضوء الذهبي على النقوش الصخرية، '
            'وارتدِ حذاءً مريحاً لأن التضاريس صخرية.'
        ),
        'response_en': (
            'The best time to visit Jubbah Petroglyphs is October through March. '
            'Arrive in the morning for golden light on the rock art, '
            'and wear comfortable shoes because the terrain is rocky.'
        ),
        'category': 'timing',
        'order': 5,
        'keywords': ['جبيل', 'jubbah', 'petroglyphs', 'نقوش'],
    },
    {
        'prompt_ar': 'فنادق وخدمات قريبة',
        'prompt_en': 'Nearby hotels & services',
        'response_ar': (
            'تتوفر فنادق واستراحات في وسط مدينة حائل على بعد دقائق من أبرز المعالم. '
            'لزيارة جبيل وحرة خيبر، يُفضّل التخطيط لرحلة يومية مع الماء والوقود. '
            'استخدم الخريطة في المنصة لمعرفة مواقع المعالم.'
        ),
        'response_en': (
            'Hotels and rest stops are available in central Hail, minutes from major landmarks. '
            'For distant sites like Jubbah and Harrat Khaybar, plan a day trip with water and fuel. '
            'Use the map on the platform to see attraction locations.'
        ),
        'category': 'services',
        'order': 6,
        'keywords': ['فندق', 'hotel', 'خدمات', 'services', 'اقامة'],
    },
    {
        'prompt_ar': 'الدليل السياحي',
        'prompt_en': 'Tour guides',
        'response_ar': (
            'يمكن حجز جولات موجهة لبعض المعالم التاريخية عبر مكاتب السياحة في حائل '
            'أو من خلال المرشدين المعتمدين عند قصر القشلة. '
            'في صفحة تفاصيل كل معلم تجد زر «احجز جولة موجهة».'
        ),
        'response_en': (
            'Guided tours for historical sites can be booked through tourism offices in Hail '
            'or certified guides at Al-Qishlah Palace. '
            'Each attraction detail page includes a Book Guided Tour button.'
        ),
        'category': 'services',
        'order': 7,
        'keywords': ['دليل', 'guide', 'جولة', 'tour', 'مرشد'],
    },
]


class Command(BaseCommand):
    help = 'Load predefined assistant replies and options'

    def handle(self, *args, **options):
        if AssistantReply.objects.exists():
            self.stdout.write(self.style.WARNING('Assistant data already exists. Skipping.'))
            return

        for data in REPLIES:
            AssistantReply.objects.create(**data)

        AssistantFallback.load()
        self.stdout.write(self.style.SUCCESS(f'Created {len(REPLIES)} assistant replies.'))
