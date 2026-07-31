"""
TradeGuard AI - Django Project Settings
========================================
This is the main configuration file for the Django project.
It configures installed apps, middleware, database, CORS, and REST framework settings.
"""

import os
from pathlib import Path

# ──────────────────────────────────────────────────────────────
# BASE DIRECTORY
# Build paths inside the project like this: BASE_DIR / 'subdir'
# ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# ──────────────────────────────────────────────────────────────
# SECURITY SETTINGS
# These are environment-driven so the same image runs in dev and prod.
# In production, provide DJANGO_SECRET_KEY and set DJANGO_DEBUG=False.
# ──────────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-tradeguard-ai-dev-key-change-in-production-2024'
)
DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('1', 'true', 'yes')
# Comma-separated list of allowed hosts; defaults to all (fine behind a gateway)
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '*').split(',')

# ──────────────────────────────────────────────────────────────
# INSTALLED APPS
# These are all the Django apps and third-party packages we use.
# - rest_framework: Django REST Framework for building APIs
# - corsheaders: Handles Cross-Origin Resource Sharing (CORS)
# - predictor: Our custom app for ML predictions
# ──────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    'rest_framework',       # Django REST Framework - for building RESTful APIs
    'corsheaders',          # CORS headers - allows frontend to call our API
    # Our custom apps
    'predictor',            # The ML prediction app (shipment delay prediction)
]

# ──────────────────────────────────────────────────────────────
# MIDDLEWARE
# Middleware processes requests/responses in order.
# CorsMiddleware MUST be placed before CommonMiddleware to work correctly.
# ──────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',    # <-- serves static files under Gunicorn
    'corsheaders.middleware.CorsMiddleware',         # <-- CORS must be high up
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'tradeguard.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'tradeguard.wsgi.application'

# ──────────────────────────────────────────────────────────────
# DATABASE
# Using SQLite for development (simple, no setup needed)
# ──────────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ──────────────────────────────────────────────────────────────
# PASSWORD VALIDATORS (default Django validators)
# ──────────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ──────────────────────────────────────────────────────────────
# INTERNATIONALIZATION
# ──────────────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'  # Indian Standard Time
USE_I18N = True
USE_TZ = True

# ──────────────────────────────────────────────────────────────
# STATIC FILES (CSS, JavaScript, Images)
# STATIC_ROOT is where `collectstatic` gathers files; WhiteNoise serves them.
# ──────────────────────────────────────────────────────────────
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
    },
}

# ──────────────────────────────────────────────────────────────
# DEFAULT PRIMARY KEY FIELD TYPE
# ──────────────────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ──────────────────────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing) CONFIGURATION
# This allows our React/Vite frontend to call the Django API.
# - localhost:5173 = Vite dev server (React frontend)
# - localhost:5000 = Alternative frontend port
# ──────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',   # Vite dev server (React frontend)
    'http://localhost:5000',   # Alternative frontend port
    'http://localhost:3000',   # Another common frontend port
]

# Also allow credentials (cookies, auth headers) in CORS requests
CORS_ALLOW_CREDENTIALS = True

# ──────────────────────────────────────────────────────────────
# DJANGO REST FRAMEWORK CONFIGURATION
# These are the default settings for all API views.
# ──────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    # Use JSON as the default renderer (API responses will be JSON)
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',  # Nice web UI for testing
    ],
    # Use JSON as the default parser (API requests should send JSON)
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    # No authentication required (public API for demo purposes)
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
