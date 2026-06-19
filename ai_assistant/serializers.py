from rest_framework import serializers

from .models import AssistantFallback, AssistantReply


class AssistantOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssistantReply
        fields = ['id', 'prompt_ar', 'prompt_en', 'category']


class AssistantConfigSerializer(serializers.Serializer):
    welcome_ar = serializers.CharField(allow_blank=True)
    welcome_en = serializers.CharField(allow_blank=True)
    fallback_ar = serializers.CharField()
    fallback_en = serializers.CharField()
    options = AssistantOptionSerializer(many=True)


class AssistantAskSerializer(serializers.Serializer):
    option_id = serializers.IntegerField(required=False)
    message = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if not data.get('option_id') and not data.get('message', '').strip():
            raise serializers.ValidationError(
                'Provide option_id or message.',
            )
        return data


class AssistantAnswerSerializer(serializers.Serializer):
    prompt_ar = serializers.CharField(required=False, allow_blank=True)
    prompt_en = serializers.CharField(required=False, allow_blank=True)
    response_ar = serializers.CharField()
    response_en = serializers.CharField()
    matched = serializers.BooleanField()
