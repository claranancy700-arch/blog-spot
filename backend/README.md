# Backend for Blog Spot

This directory contains a simple Django REST framework backend to manage posts.

## Setup

1. Create and activate a Python virtual environment (recommended):
   ```bash
   python -m venv venv
   venv\Scripts\activate        # Windows
   # or `source venv/bin/activate` on macOS/Linux
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run migrations:
   ```bash
   python manage.py migrate
   ```
4. Create a superuser for the admin interface:
   ```bash
   python manage.py createsuperuser
   ```
5. Start the development server:
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api/posts/` and the admin at
`http://localhost:8000/admin/`.

Public GET requests are allowed; write operations require authentication (cookie or
`Authorization: Token` if you add token auth later).

You can extend this backend with custom fields, social-media posting tasks, or
additional models as needed.