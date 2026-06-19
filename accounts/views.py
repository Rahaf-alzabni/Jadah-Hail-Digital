from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from tourism.models import TouristPlace
from tourism.serializers import TouristPlaceSummarySerializer

from .models import UserProfile
from .serializers import FavoriteSerializer


def get_user_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


class FavoriteViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        profile = get_user_profile(request.user)
        places = profile.favorite_places.all()
        serializer = TouristPlaceSummarySerializer(
            places, many=True, context={'request': request},
        )
        return Response(serializer.data)

    def create(self, request):
        serializer = FavoriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        place = TouristPlace.objects.get(pk=serializer.validated_data['place_id'])
        profile = get_user_profile(request.user)
        profile.favorite_places.add(place)
        return Response(
            TouristPlaceSummarySerializer(place, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, pk=None):
        profile = get_user_profile(request.user)
        place = profile.favorite_places.filter(pk=pk).first()
        if not place:
            return Response(
                {'detail': 'Place is not in your favorites.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        profile.favorite_places.remove(place)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle(self, request, pk=None):
        profile = get_user_profile(request.user)
        place = TouristPlace.objects.filter(pk=pk).first()
        if not place:
            return Response(
                {'detail': 'Tourist place not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if profile.favorite_places.filter(pk=pk).exists():
            profile.favorite_places.remove(place)
            return Response({'is_favorited': False})
        profile.favorite_places.add(place)
        return Response({'is_favorited': True})
