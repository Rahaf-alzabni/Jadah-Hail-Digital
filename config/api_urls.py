from django.urls import include, path

urlpatterns = [
    path('', include('tourism.urls')),
    path('', include('events.urls')),
    path('', include('accounts.urls')),
    path('', include('ai_assistant.urls')),
]
