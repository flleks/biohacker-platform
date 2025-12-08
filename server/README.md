# Biohacker Platform – Backend (Express + MongoDB)

## Szybki start

1. Zainstaluj zależności:

```bash
npm install
```

2. Utwórz plik `.env` w katalogu `server/` z poniższą zawartością (dostosuj wartości):

```bash
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/biohacker-platform
JWT_SECRET=change_me_dev_secret
```

3. Uruchom serwer (dev):

```bash
npm run dev
```

4. Healthcheck:

```bash
GET http://localhost:4000/health
```

## API

- Auth
  - POST `/api/auth/register` – body: `{ username, email, password }`
  - POST `/api/auth/login` – body: `{ email, password }`
  - GET `/api/auth/me` – nagłówek: `Authorization: Bearer <token>`

- Posts
  - GET `/api/posts`
  - GET `/api/posts/:id`
  - POST `/api/posts` – body: `{ content, tags?: string[] }` + `Authorization`
  - DELETE `/api/posts/:id` – tylko właściciel + `Authorization`
  - POST `/api/posts/:id/like` – toggle like/unlike + `Authorization`

- Comments
  - GET `/api/comments/post/:postId`
  - POST `/api/comments` – body: `{ postId, content }` + `Authorization`

## Notatki
- Domyślne wartości działają lokalnie z `mongodb://127.0.0.1:27017`.
- W produkcji ustaw silny `JWT_SECRET` i użyj zarządzanego MongoDB.


