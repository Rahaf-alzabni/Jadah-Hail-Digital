from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import UserProfile
from tourism.models import TouristPlace


class AuthenticationAPITests(APITestCase):
    """API tests for session-based authentication."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='rahaf', password='SecurePass123!')

    def test_me_returns_unauthenticated_by_default(self):
        response = self.client.get('/api/v1/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['authenticated'])

    def test_login_with_valid_credentials(self):
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'rahaf',
            'password': 'SecurePass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['authenticated'])

    def test_login_with_invalid_credentials(self):
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'rahaf',
            'password': 'wrong-password',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_me_returns_authenticated_after_login(self):
        self.client.login(username='rahaf', password='SecurePass123!')
        response = self.client.get('/api/v1/auth/me/')
        self.assertTrue(response.data['authenticated'])
        self.assertEqual(response.data['username'], 'rahaf')

    def test_logout_clears_session(self):
        self.client.login(username='rahaf', password='SecurePass123!')
        response = self.client.post('/api/v1/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        me = self.client.get('/api/v1/auth/me/')
        self.assertFalse(me.data['authenticated'])


class FavoritesAPITests(APITestCase):
    """API tests for favorites management."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='favuser', password='TestPass123!')
        cls.profile = UserProfile.objects.create(user=cls.user)
        cls.place = TouristPlace.objects.create(
            name_ar='معالم',
            name_en='Landmark',
            description='Test',
            category='cultural',
            latitude=27.5,
            longitude=41.6,
        )

    def test_add_favorite_requires_authentication(self):
        response = self.client.post('/api/v1/favorites/', {'place_id': self.place.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_user_can_add_favorite(self):
        self.client.force_login(self.user)
        response = self.client.post('/api/v1/favorites/', {'place_id': self.place.id}, format='json')
        self.assertIn(response.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))
        self.assertTrue(self.profile.favorite_places.filter(pk=self.place.pk).exists())
