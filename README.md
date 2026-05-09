# DevCollab

DevCollab is a full-stack collaboration platform built with a React (Vite) frontend and a Node.js/Express backend. This public repository is configured to be safe for GitHub sharing: real credentials are excluded, startup validation rejects placeholder secrets, and only public-safe `VITE_*` variables are allowed in the frontend.

## Project Structure

- `frontend/` - Vite + React client deployed to Vercel
- `backend/` - Express + MongoDB API deployed to Render

## Environment Setup

1. Copy the example files:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env`
2. Replace every placeholder with real values from your own services.
3. Never commit real `.env` files or build output.

### Backend environment variables

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRES_IN`
- `CLIENT_URL`
- `GOOGLE_CLIENT_ID`

### Frontend public environment variables

Only these values are allowed client-side:

- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not place server secrets, database credentials, JWT secrets, OAuth client secrets, or private keys in the frontend.

## Local Development

### Backend

```powershell
cd backend
npm install
npm start
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Security Notes

- The backend performs environment validation at startup and will refuse to boot with missing or placeholder secrets.
- Public-safe frontend environment variables are centralized in `frontend/src/config/publicEnv.js`.
- Generated build output such as `frontend/dist/` should never be committed.
- Runtime logs, temp output, and `.env` files are ignored by Git.

## Secret Rotation Required After Exposure

If this repository ever contained real secrets publicly, rotate them immediately:

1. MongoDB Atlas database user password / connection string
2. JWT signing secrets
3. Refresh token signing secrets
4. Any OAuth client secrets (if they existed outside this repo)
5. Any deployment secrets stored in Vercel, Render, or other services

Client IDs and Supabase anon keys are public-facing by design, but you should still review service configuration after any exposure event.

## Public Repository Checklist

- No real `.env` files tracked
- No build artifacts tracked
- No runtime logs tracked
- No hardcoded secrets in source
- Example env files contain placeholders only
- Deployment secrets are managed in hosting providers, not in Git
