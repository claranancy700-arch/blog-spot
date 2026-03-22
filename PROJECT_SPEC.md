# Blog Spot — Project Specification

This document is the canonical reference for the Blog Spot project. Every session, change, or new feature should reference this file before making changes.

## Goals
- Build an Instagram‑like multi‑author blog with a lo‑fi aesthetic.
- React + Vite frontend, Django + DRF backend with session auth and CSRF protection.
- Rich posts with images/video (URL or uploaded file), Markdown support (body converted to HTML), comments, likes, profiles, and optional social cross‑posting.

---

## Pages (Frontend)

1. Home / Feed
   - Path: `/`
   - Shows published posts ordered by newest.
   - Supports infinite scroll / pagination.
   - Filters: all or only posts from users you follow (toggle button).
   - Search box for text across titles/body/author.
   - Clickable tags under posts; feed can be filtered by tag via query param or toggle.

2. Post detail (future)
   - Path: `/post/:id` or `/p/:slug`
   - Full content, images/video, comments, likes, share buttons.

3. Signup
   - Path: `/signup`
   - Fields: username, email, password.
   - Sends `X-CSRFToken` header; uses `credentials: 'include'`.

4. Login
   - Path: `/login`
   - Username + password; Show/Hide password control.
   - Returns user info and establishes session cookie.

5. Dashboard / Admin (app UI)
   - Path: `/dashboard`
   - Create / edit / delete posts (title, body, image/video, published toggle, tags).
   - Drafts listing and publish flow.

6. User profile & account settings
   - Path: `/profile` (current user) or `/user/:username` (public view).
   - View/edit email, name, change password link.

7. Authentication helpers
   - Path: `/login`, `/signup` (see earlier).
   - `/forgot-password` — prompt for email to receive reset link.
   - `/reset-password` — consumable link with `uid` and `token` query params.
   - `/confirm-email/:uid/:token` — email activation landing page (click from email).

8. Search / Tags
   - Path: `/search` and `/tags/:tag`
   - Full text or tag based filtering.

7. Settings / Account
   - Change password, email, connected social accounts.

8. Search / Tags
   - Path: `/search` and `/tags/:tag`
   - Full text or tag based filtering.

9. Static pages
   - About, Terms, Privacy.

---

## Backend API (DRF)

Base: `/api/`

Core endpoints:
- `GET /api/posts/` — list posts (filter by author, tag, published)
- `GET /api/posts/:id/` — detail
- `POST /api/posts/` — create (auth required) — supports multipart for media (image/video upload) or JSON including `video_url`.
- `PATCH /api/posts/:id/` — partial update (auth + ownership); accepts multipart/form-data or JSON, updates media.
- `DELETE /api/posts/:id/` — delete (auth + ownership)

Auth:
- `POST /api/register/` — create user (CSRF protected, returns 201). by default sets `is_active=False` and sends confirmation email; user must confirm before login. In DEBUG mode accounts are immediately active for convenience.
- `GET /api/confirm_email/<uid>/<token>/` — activate account via link in email.
- `POST /api/login/` — credentials -> login (CSRF protected or exempt); returns user info and establishes session cookie.
- `POST /api/logout/` — invalidate session (CSRF protected).
- `GET /api/user/` — current user info (auth required); supports `PATCH` to update email/first/last name.
- `POST /api/change_password/` — authenticated user can change password (CSRF protected).
- `POST /api/password_reset/` — send password reset email (console backend dev).
- `POST /api/password_reset_confirm/` — set new password given uid/token (CSRF protected).
- `GET /api/csrf/` — ensure CSRF cookie set

Profiles & social:
- `GET /api/users/:username/` — public profile
- `POST /api/users/:username/follow/` — follow/unfollow

Comments & likes:
- `GET/POST /api/posts/:id/comments/` — reading and creating comments.
- Backend returns `author_username` on comments.
- `POST /api/posts/:id/like/` — toggle like. Response contains `liked` boolean and updated count.

Media:
- `POST /api/uploads/` — optional temporary upload endpoint
- Serve media via `MEDIA_URL` (dev static), use external storage for prod

Search & tags:
- `GET /api/search/?q=...`
- `GET /api/tags/` — list tags
- `GET /api/tags/:tag/posts/`

Admin utilities (server):
- Approve content, moderate comments, view stats

---

## Models (minimum)

- User (Django built-in)
- Profile
  - user (OneToOne), bio, avatar, social links
- Post
  - author (FK), title, body (Markdown), image (ImageField), video (URL/File), tags, created, updated, published (bool), slug
- Comment
  - post (FK), author (FK), body, created, parent (optional for threading)
- Like
  - user, post (unique together)
- Follow
  - follower, followee (unique together)

---

## Frontend components

- `App.jsx` — routing, theme toggle, global auth state
- `Home.jsx` — feed + filters
- `PostList.jsx` / `PostCard.jsx` — rendered posts
- `PostForm.jsx` — create/edit with media upload
- `PostDetail.jsx` — full post + comments
- `Login.jsx`, `Signup.jsx` — auth pages
- `Profile.jsx` — user pages
- `Admin/Dashboard.jsx` — author tools
- `Starfield.js` — background animation
- `csrf.js` — helper to read `csrftoken` cookie

---

## UI / UX

- Default: dark theme. Optional light (lo‑fi) theme via toggle (`localStorage.theme`).
- Mobile responsive design (breakpoints, stacked layout).
- Accessibility: labels on inputs, keyboard focus, semantic markup.
- Image/video handling: previews, client resize optional, drag & drop, separate URL/file handling for video.
- Progressive enhancement: graceful errors when backend offline.

---

## Security

- CSRF: session auth + `X-CSRFToken` header for state‑changing requests.
- CORS: restrict `CORS_ALLOWED_ORIGINS` to frontend host(s).
- Passwords: use Django's built‑in hashing; add email verification for production.
- Rate limiting on auth/endpoints (DRF or proxy layer) for abuse mitigation.

---

## Dev / Deployment

- Dev: SQLite, Django dev server, Vite frontend dev server.
- Prod: Postgres (managed), S3 or Cloudinary for media, Daphne / Gunicorn + Nginx.
- Dockerfile for both frontend and backend; docker-compose for local stack (db, redis, web, worker).
- Environment variables: secret key, DB URL, allowed hosts, CORS origins, external API keys.

Commands to run locally (examples):

```bash
# backend
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# frontend
npm install
npm run dev
```

---

## Priority roadmap (recommended order)

1. Solidify auth (register, login, logout, session + CSRF). Validate end‑to‑end.
2. Rich posts: image uploads, Post model, PostForm, display images in feed.
3. Profiles & follow system.
4. Comments & likes (with counts and toggle in UI).
5. Tagging, search, and filtering (tags as first-class resource + search field).
6. Media hosting integration (S3/Cloudinary) + thumbnails.
7. Social cross‑posting jobs (background worker + OAuth integration).
8. Deployment: Docker, Postgres, CI, environment configs.
9. Analytics, admin moderation tools.
10. Polish: mobile UX, themes, performance tuning.

---

## Testing & QA

- Unit tests for serializers, views, and model behavior.
- Integration tests for auth flows and file uploads.
- E2E tests (Cypress) for core user journeys (signup, login, create post, comment).

---

## Conventions

- API paths use plural nouns and RESTful verbs.
- Frontend uses functional React components + hooks.
- Keep code small and focused; make small PRs with descriptive messages.

---

## How to use this document

- Reference the model/endpoint/UI sections before adding or modifying code.
- Add new features by updating the Roadmap and Models sections here.
- When starting a new task, add it to the tracked TODO list (see project root tasks).

---

## Open questions / future decisions

- Use Markdown (server rendered) vs. WYSIWYG? (Markdown recommended.)
- Background worker: Celery + Redis vs. lightweight cron? (Celery recommended for cross‑posting.)
- Media hosting provider choice: S3 vs Cloudinary (Cloudinary simpler, S3 cheaper at scale).

---

## Contacts
- Primary developer: `debtary` (local workspace owner)


---

Keep this file updated as architecture or priorities change.
