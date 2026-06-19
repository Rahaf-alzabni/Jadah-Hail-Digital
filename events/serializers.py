from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            'id',
            'title_ar',
            'title_en',
            'description',
            'description_ar',
            'image',
            'location',
            'location_ar',
            'start_date',
            'end_date',
            'created_at',
        ]
        read_only_fields = ['created_at']

    def validate(self, data):
        start_date = data.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = data.get('end_date', getattr(self.instance, 'end_date', None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date.',
            })
        return data
