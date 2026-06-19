from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from events.models import Event


def api_results(response):
    data = response.data
    if isinstance(data, dict) and 'results' in data:
        return data['results']
    return data


class EventAPITests(APITestCase):
    """API tests for tourism events."""

    @classmethod
    def setUpTestData(cls):
        now = timezone.now()
        cls.event = Event.objects.create(
            title_ar='مهرجان حائل',
            title_en='Hail Festival',
            description='Annual tourism festival.',
            location='Hail City',
            start_date=now,
            end_date=now + timezone.timedelta(days=3),
        )

    def test_list_events_returns_200(self):
        response = self.client.get('/api/v1/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(api_results(response)), 1)

    def test_event_contains_bilingual_titles(self):
        response = self.client.get('/api/v1/events/')
        event = api_results(response)[0]
        self.assertIn('title_en', event)
        self.assertIn('title_ar', event)
        self.assertEqual(event['title_en'], 'Hail Festival')
