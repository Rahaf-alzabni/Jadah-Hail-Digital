from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ReviewViewSet, TouristPlaceViewSet, TouristRouteViewSet

router = DefaultRouter()
router.register('places', TouristPlaceViewSet, basename='place')
router.register('reviews', ReviewViewSet, basename='review')
router.register('routes', TouristRouteViewSet, basename='route')

urlpatterns = [
    path('', include(router.urls)),
]
