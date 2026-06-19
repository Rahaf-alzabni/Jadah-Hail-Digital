from django.contrib import admin

from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title_en', 'title_ar', 'location', 'start_date', 'end_date')
    list_filter = ('start_date', 'end_date', 'location')
    search_fields = ('title_en', 'title_ar', 'description', 'location')
    readonly_fields = ('created_at',)
    date_hierarchy = 'start_date'
    fieldsets = (
        (None, {
            'fields': ('title_ar', 'title_en', 'description', 'image'),
        }),
        ('Schedule & Location', {
            'fields': ('location', 'start_date', 'end_date'),
        }),
        ('Metadata', {
            'fields': ('created_at',),
        }),
    )
