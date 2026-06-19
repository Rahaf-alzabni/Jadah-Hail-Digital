from django.contrib import admin

from .models import AssistantFallback, AssistantReply


@admin.register(AssistantReply)
class AssistantReplyAdmin(admin.ModelAdmin):
    list_display = ('prompt_en', 'prompt_ar', 'category', 'order', 'is_active', 'is_welcome')
    list_filter = ('category', 'is_active', 'is_welcome')
    search_fields = ('prompt_en', 'prompt_ar', 'response_en', 'response_ar', 'keywords')
    list_editable = ('order', 'is_active')
    ordering = ('order', 'id')
    fieldsets = (
        (None, {
            'fields': ('prompt_ar', 'prompt_en', 'category', 'order', 'is_active', 'is_welcome'),
        }),
        ('Responses', {
            'fields': ('response_ar', 'response_en', 'keywords'),
        }),
    )


@admin.register(AssistantFallback)
class AssistantFallbackAdmin(admin.ModelAdmin):
    list_display = ('message_en',)

    def has_add_permission(self, request):
        return not AssistantFallback.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
