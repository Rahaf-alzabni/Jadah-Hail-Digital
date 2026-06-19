from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .auth_views import csrf_view, login_view, logout_view, me_view
from .views import FavoriteViewSet

router = DefaultRouter()
router.register('favorites', FavoriteViewSet, basename='favorite')

urlpatterns = [
    path('auth/csrf/', csrf_view, name='auth-csrf'),
    path('auth/me/', me_view, name='auth-me'),
    path('auth/login/', login_view, name='auth-login'),
    path('auth/logout/', logout_view, name='auth-logout'),
    path('', include(router.urls)),
]
