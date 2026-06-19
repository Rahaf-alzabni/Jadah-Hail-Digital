from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny

from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title_ar', 'title_en', 'description', 'location']
    ordering_fields = ['start_date', 'end_date', 'created_at']
    ordering = ['start_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        upcoming = self.request.query_params.get('upcoming')
        if upcoming and upcoming.lower() == 'true':
            from django.utils import timezone
            queryset = queryset.filter(end_date__gte=timezone.now())
        return queryset
