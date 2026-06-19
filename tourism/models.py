from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class TouristPlace(models.Model):
    CATEGORY_CHOICES = [
        ('historical', 'Historical'),
        ('natural', 'Natural'),
        ('cultural', 'Cultural'),
        ('entertainment', 'Entertainment'),
        ('religious', 'Religious'),
    ]

    name_ar = models.CharField('Arabic name', max_length=200)
    name_en = models.CharField('English name', max_length=200)
    description = models.TextField()
    description_ar = models.TextField('Arabic description', blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    image = models.ImageField(
        upload_to='tourist_places/',
        blank=True,
        null=True,
    )
    latitude = models.FloatField()
    longitude = models.FloatField()
    visiting_hours = models.CharField(max_length=100, blank=True)
    visiting_hours_ar = models.CharField('Arabic visiting hours', max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Tourist place'
        verbose_name_plural = 'Tourist places'

    def __str__(self):
        return self.name_en


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    tourist_place = models.ForeignKey(
        TouristPlace,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'tourist_place'],
                name='unique_review_per_user_place',
            ),
        ]

    def __str__(self):
        return f'{self.user} — {self.tourist_place} ({self.rating}/5)'


class TouristRoute(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('moderate', 'Moderate'),
        ('hard', 'Hard'),
    ]

    name = models.CharField(max_length=200)
    name_ar = models.CharField('Arabic name', max_length=200, blank=True)
    description = models.TextField()
    description_ar = models.TextField('Arabic description', blank=True)
    duration = models.CharField(
        max_length=100,
        help_text='Estimated duration, e.g. "2 hours" or "Full day".',
    )
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    places = models.ManyToManyField(
        TouristPlace,
        related_name='routes',
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Tourist route'
        verbose_name_plural = 'Tourist routes'

    def __str__(self):
        return self.name
