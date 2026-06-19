#!/usr/bin/env bash
# Render.com build script — Django API + React frontend (single URL)
set -o errexit

echo "==> Installing Python dependencies"
pip install -r requirements.txt

echo "==> Installing Node dependencies"
npm ci

echo "==> Building React frontend"
VITE_BASE_PATH=/ npm run build

echo "==> Running Django migrations"
python manage.py migrate --noinput

echo "==> Loading demo data"
python manage.py load_demo_data || true
python manage.py sync_arabic_content || true
python manage.py load_assistant_data || true

echo "==> Copying bundled images to media"
mkdir -p media/tourist_places media/events
cp -f public/images/places/* media/tourist_places/ 2>/dev/null || true
cp -f public/images/events/* media/events/ 2>/dev/null || true

echo "==> Attaching Hail landmark images"
python manage.py import_hail_images || true

echo "==> Collecting static files"
python manage.py collectstatic --noinput

echo "==> Build complete"
