from django.db import models


class Event(models.Model):
    title_ar = models.CharField('Arabic title', max_length=200)
    title_en = models.CharField('English title', max_length=200)
    description = models.TextField()
    description_ar = models.TextField('Arabic description', blank=True)
    image = models.ImageField(
        upload_to='events/',
        blank=True,
        null=True,
    )
    location = models.CharField(max_length=255)
    location_ar = models.CharField('Arabic location', max_length=255, blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_date']
        verbose_name = 'Event'
        verbose_name_plural = 'Events'

    def __str__(self):
        return self.title_en

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError({'end_date': 'End date must be after start date.'})
