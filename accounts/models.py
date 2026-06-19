from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    LANGUAGE_CHOICES = [
        ('ar', 'Arabic'),
        ('en', 'English'),
    ]

    INTEREST_CHOICES = [
        ('historical', 'Historical'),
        ('natural', 'Natural'),
        ('cultural', 'Cultural'),
        ('entertainment', 'Entertainment'),
        ('religious', 'Religious'),
        ('events', 'Events'),
        ('food', 'Food & Dining'),
        ('adventure', 'Adventure'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    preferred_language = models.CharField(
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default='ar',
    )
    interests = models.JSONField(
        default=list,
        blank=True,
        help_text='List of interest keys matching INTEREST_CHOICES.',
    )
    favorite_places = models.ManyToManyField(
        'tourism.TouristPlace',
        related_name='favorited_by',
        blank=True,
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User profile'
        verbose_name_plural = 'User profiles'

    def __str__(self):
        return f'Profile: {self.user}'
