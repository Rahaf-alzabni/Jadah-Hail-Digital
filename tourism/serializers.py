from rest_framework import serializers

from .models import Review, TouristPlace, TouristRoute


class TouristPlaceSerializer(serializers.ModelSerializer):
    average_rating = serializers.FloatField(read_only=True, allow_null=True)
    review_count = serializers.IntegerField(read_only=True)
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = TouristPlace
        fields = [
            'id',
            'name_ar',
            'name_en',
            'description',
            'description_ar',
            'category',
            'image',
            'latitude',
            'longitude',
            'visiting_hours',
            'visiting_hours_ar',
            'created_at',
            'average_rating',
            'review_count',
            'is_favorited',
        ]
        read_only_fields = ['created_at']

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        if profile is None:
            return False
        return profile.favorite_places.filter(pk=obj.pk).exists()


class TouristPlaceSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = TouristPlace
        fields = ['id', 'name_ar', 'name_en', 'category', 'image']


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    place_name = serializers.CharField(source='tourist_place.name_en', read_only=True)
    place_name_ar = serializers.CharField(source='tourist_place.name_ar', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id',
            'user',
            'username',
            'tourist_place',
            'place_name',
            'place_name_ar',
            'rating',
            'comment',
            'created_at',
        ]
        read_only_fields = ['user', 'created_at']

    def validate(self, data):
        request = self.context.get('request')
        place = data.get('tourist_place')
        if request and request.user.is_authenticated and place:
            if Review.objects.filter(user=request.user, tourist_place=place).exists():
                raise serializers.ValidationError(
                    'You have already submitted a review for this place.'
                )
        return data


class TouristRouteSerializer(serializers.ModelSerializer):
    places = TouristPlaceSummarySerializer(many=True, read_only=True)
    place_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=TouristPlace.objects.all(),
        source='places',
        write_only=True,
        required=False,
    )

    class Meta:
        model = TouristRoute
        fields = [
            'id',
            'name',
            'name_ar',
            'description',
            'description_ar',
            'duration',
            'difficulty',
            'places',
            'place_ids',
            'created_at',
        ]
        read_only_fields = ['created_at']
