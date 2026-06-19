from django.db import models


class AssistantReply(models.Model):
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('places', 'Places'),
        ('routes', 'Routes'),
        ('events', 'Events'),
        ('timing', 'Timing'),
        ('services', 'Services'),
    ]

    prompt_ar = models.CharField('Arabic prompt', max_length=200)
    prompt_en = models.CharField('English prompt', max_length=200)
    response_ar = models.TextField('Arabic response')
    response_en = models.TextField('English response')
    keywords = models.JSONField(
        default=list,
        blank=True,
        help_text='Extra words to match when the visitor types freely.',
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_welcome = models.BooleanField(
        default=False,
        help_text='Shown once when the chat opens.',
    )

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'Assistant reply'
        verbose_name_plural = 'Assistant replies'

    def __str__(self):
        return self.prompt_en


class AssistantFallback(models.Model):
    message_ar = models.TextField('Arabic fallback message')
    message_en = models.TextField('English fallback message')

    class Meta:
        verbose_name = 'Assistant fallback'
        verbose_name_plural = 'Assistant fallback'

    def __str__(self):
        return 'Default fallback message'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                'message_ar': (
                    'اختر أحد الخيارات أدناه للحصول على إجابة فورية، '
                    'أو اكتب سؤالك وسأحاول مساعدتك.'
                ),
                'message_en': (
                    'Choose one of the options below for an instant answer, '
                    'or type your question and I will try to help.'
                ),
            },
        )
        return obj
