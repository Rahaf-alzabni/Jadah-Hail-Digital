from rest_framework import serializers

from tourism.serializers import TouristPlaceSummarySerializer

from .models import UserProfile


class FavoriteSerializer(serializers.Serializer):
    place_id = serializers.IntegerField()

    def validate_place_id(self, value):
        from tourism.models import TouristPlace

        if not TouristPlace.objects.filter(pk=value).exists():
            raise serializers.ValidationError('Tourist place not found.')
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    favorite_places = TouristPlaceSummarySerializer(many=True, read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'preferred_language',
            'interests',
            'favorite_places',
            'updated_at',
        ]
        read_only_fields = ['updated_at']
