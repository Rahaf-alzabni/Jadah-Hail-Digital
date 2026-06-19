from django.db.models import Avg, Count, FloatField
from django.db.models.functions import Round
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Review, TouristPlace, TouristRoute
from .permissions import IsReviewOwner
from .serializers import ReviewSerializer, TouristPlaceSerializer, TouristRouteSerializer


class TouristPlaceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TouristPlaceSerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name_ar', 'name_en', 'description']
    ordering_fields = ['created_at', 'name_en', 'name_ar']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = TouristPlace.objects.annotate(
            review_count=Count('reviews'),
            average_rating=Round(Avg('reviews__rating'), 1, output_field=FloatField()),
        )
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    filter_backends = [OrderingFilter]
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Review.objects.select_related('user', 'tourist_place')
        place_id = self.request.query_params.get('place')
        if place_id:
            queryset = queryset.filter(tourist_place_id=place_id)
        return queryset

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsReviewOwner()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TouristRouteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TouristRoute.objects.prefetch_related('places')
    serializer_class = TouristRouteSerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'difficulty', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        return queryset
