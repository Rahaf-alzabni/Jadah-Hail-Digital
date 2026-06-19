from django.contrib import admin

from .models import Review, TouristPlace, TouristRoute


class ReviewInline(admin.TabularInline):
    model = Review
    extra = 0
    readonly_fields = ('created_at',)
    autocomplete_fields = ('user',)


@admin.register(TouristPlace)
class TouristPlaceAdmin(admin.ModelAdmin):
    list_display = (
        'name_en',
        'name_ar',
        'category',
        'latitude',
        'longitude',
        'created_at',
    )
    list_filter = ('category', 'created_at')
    search_fields = ('name_en', 'name_ar', 'description')
    readonly_fields = ('created_at',)
    inlines = [ReviewInline]
    fieldsets = (
        (None, {
            'fields': ('name_ar', 'name_en', 'description', 'category', 'image'),
        }),
        ('Location', {
            'fields': ('latitude', 'longitude', 'visiting_hours'),
        }),
        ('Metadata', {
            'fields': ('created_at',),
        }),
    )


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'tourist_place', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = (
        'user__username',
        'user__email',
        'tourist_place__name_en',
        'tourist_place__name_ar',
        'comment',
    )
    readonly_fields = ('created_at',)
    autocomplete_fields = ('user', 'tourist_place')


@admin.register(TouristRoute)
class TouristRouteAdmin(admin.ModelAdmin):
    list_display = ('name', 'duration', 'difficulty', 'created_at')
    list_filter = ('difficulty', 'created_at')
    search_fields = ('name', 'description')
    filter_horizontal = ('places',)
    readonly_fields = ('created_at',)
