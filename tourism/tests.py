from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from tourism.models import Review, TouristPlace, TouristRoute


def api_results(response):
    """Return list payload from paginated or plain DRF responses."""
    data = response.data
    if isinstance(data, dict) and 'results' in data:
        return data['results']
    return data


class TouristPlaceAPITests(APITestCase):
    """API tests for tourist places listing and filtering."""

    @classmethod
    def setUpTestData(cls):
        cls.place_historical = TouristPlace.objects.create(
            name_ar='قلعة برزان',
            name_en='Barzan Palace',
            description='Historical palace in Hail.',
            category='historical',
            latitude=27.5114,
            longitude=41.6903,
        )
        cls.place_natural = TouristPlace.objects.create(
            name_ar='جبة وادي الرمان',
            name_en='Jubbah Rock Art',
            description='UNESCO rock art site.',
            category='natural',
            latitude=28.0156,
            longitude=40.9234,
        )

    def test_list_places_returns_200(self):
        response = self.client.get('/api/v1/places/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(api_results(response)), 2)

    def test_list_places_includes_required_fields(self):
        response = self.client.get('/api/v1/places/')
        place = api_results(response)[0]
        for field in ('id', 'name_en', 'name_ar', 'category', 'latitude', 'longitude'):
            self.assertIn(field, place)

    def test_filter_places_by_category(self):
        response = self.client.get('/api/v1/places/', {'category': 'natural'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = api_results(response)
        self.assertTrue(all(p['category'] == 'natural' for p in results))

    def test_search_places_by_name(self):
        response = self.client.get('/api/v1/places/', {'search': 'Barzan'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = api_results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name_en'], 'Barzan Palace')


class ReviewAPITests(APITestCase):
    """API tests for review creation and permissions."""

    @classmethod
    def setUpTestData(cls):
        cls.place = TouristPlace.objects.create(
            name_ar='آبار سامود',
            name_en='Samoud Wells',
            description='Heritage wells.',
            category='historical',
            latitude=27.52,
            longitude=41.68,
        )
        cls.user = User.objects.create_user(username='visitor1', password='TestPass123!')

    def test_create_review_requires_authentication(self):
        response = self.client.post('/api/v1/reviews/', {
            'tourist_place': self.place.id,
            'rating': 5,
            'comment': 'Excellent heritage site.',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_user_can_create_review(self):
        self.client.force_login(self.user)
        response = self.client.post('/api/v1/reviews/', {
            'tourist_place': self.place.id,
            'rating': 4,
            'comment': 'Worth visiting.',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.count(), 1)
        self.assertEqual(response.data['rating'], 4)

    def test_duplicate_review_per_user_is_rejected(self):
        Review.objects.create(user=self.user, tourist_place=self.place, rating=3, comment='First')
        self.client.force_login(self.user)
        response = self.client.post('/api/v1/reviews/', {
            'tourist_place': self.place.id,
            'rating': 5,
            'comment': 'Duplicate attempt.',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_reviews_filtered_by_place(self):
        Review.objects.create(user=self.user, tourist_place=self.place, rating=5, comment='Great')
        response = self.client.get('/api/v1/reviews/', {'place': self.place.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(api_results(response)), 1)


class TouristRouteAPITests(APITestCase):
    """API tests for tourist routes."""

    @classmethod
    def setUpTestData(cls):
        cls.place = TouristPlace.objects.create(
            name_ar='مكان',
            name_en='Sample Place',
            description='Desc',
            category='cultural',
            latitude=27.5,
            longitude=41.6,
        )
        cls.route = TouristRoute.objects.create(
            name='Heritage Trail',
            description='A cultural route.',
            duration='4 hours',
            difficulty='easy',
        )
        cls.route.places.add(cls.place)

    def test_list_routes_returns_200(self):
        response = self.client.get('/api/v1/routes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_route_includes_nested_places(self):
        response = self.client.get('/api/v1/routes/')
        route = next(r for r in api_results(response) if r['name'] == 'Heritage Trail')
        self.assertEqual(len(route['places']), 1)
        self.assertEqual(route['places'][0]['name_en'], 'Sample Place')
