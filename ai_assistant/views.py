from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import AssistantFallback, AssistantReply
from .serializers import (
    AssistantAnswerSerializer,
    AssistantAskSerializer,
    AssistantConfigSerializer,
    AssistantOptionSerializer,
)


def build_config():
    welcome = AssistantReply.objects.filter(is_active=True, is_welcome=True).first()
    fallback = AssistantFallback.load()
    options = AssistantReply.objects.filter(is_active=True, is_welcome=False)

    return {
        'welcome_ar': welcome.response_ar if welcome else '',
        'welcome_en': welcome.response_en if welcome else '',
        'fallback_ar': fallback.message_ar,
        'fallback_en': fallback.message_en,
        'options': AssistantOptionSerializer(options, many=True).data,
    }


def find_reply(option_id=None, message=''):
    if option_id:
        return AssistantReply.objects.filter(pk=option_id, is_active=True).first()

    text = message.strip().lower()
    if not text:
        return None

    for reply in AssistantReply.objects.filter(is_active=True, is_welcome=False):
        prompts = [reply.prompt_ar.lower(), reply.prompt_en.lower()]
        keywords = [k.lower() for k in reply.keywords]
        haystack = prompts + keywords
        if any(token in text or text in token for token in haystack if token):
            return reply

    return None


class AssistantViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        serializer = AssistantConfigSerializer(build_config())
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='ask')
    def ask(self, request):
        serializer = AssistantAskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        option_id = serializer.validated_data.get('option_id')
        message = serializer.validated_data.get('message', '')
        reply = find_reply(option_id=option_id, message=message)
        fallback = AssistantFallback.load()

        if reply:
            data = {
                'prompt_ar': reply.prompt_ar,
                'prompt_en': reply.prompt_en,
                'response_ar': reply.response_ar,
                'response_en': reply.response_en,
                'matched': True,
            }
        else:
            data = {
                'prompt_ar': message,
                'prompt_en': message,
                'response_ar': fallback.message_ar,
                'response_en': fallback.message_en,
                'matched': False,
            }

        return Response(AssistantAnswerSerializer(data).data, status=status.HTTP_200_OK)
