
# Jadah Hail — Smart Tourism Platform

Django REST API backend + React frontend based on the [Figma design](https://www.figma.com/design/HtIK18COvjqZpHnc9EubU7/Smart-Tourism-Platform-Design).

## Stack

- **Backend:** Django 6 + Django REST Framework + SQLite
- **Frontend:** React + Vite + Tailwind CSS (Figma export)

## Quick start

### 1. Backend

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py load_demo_data
python manage.py createsuperuser
python manage.py runserver
```

API: `http://127.0.0.1:8000/api/v1/`  
Admin: `http://127.0.0.1:8000/admin/`

### 2. Frontend

```bash
npm install
npm run dev
```

App: `http://localhost:5173`

The Vite dev server proxies `/api` and `/media` to Django.

## API endpoints used by the UI

| Feature | Endpoint |
|---------|----------|
| Places | `GET /api/v1/places/` |
| Events | `GET /api/v1/events/?upcoming=true` |
| Routes | `GET /api/v1/routes/` |
| Reviews | `GET/POST /api/v1/reviews/` |
| Favorites | `GET/POST/DELETE /api/v1/favorites/` |
| Auth | `POST /api/v1/auth/login/` |

Sign in with your Django superuser account to save favorites and submit reviews.
