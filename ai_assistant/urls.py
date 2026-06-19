from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AssistantViewSet

router = DefaultRouter()
router.register('assistant', AssistantViewSet, basename='assistant')

urlpatterns = [
    path('', include(router.urls)),
]
