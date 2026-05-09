# Security Cleanup Guide

This repository is intended to be safe for public GitHub visibility. Use this checklist whenever secrets were exposed or deployment configuration changes.

## Secrets That Must Never Be Committed

- `.env` files of any kind
- MongoDB URIs with usernames/passwords
- JWT secrets
- refresh token secrets
- OAuth client secrets
- Firebase / service account JSON files
- deployment provider secrets
- private keys / certificates
- generated logs that may include connection details

## Required Rotation After Public Exposure

If a secret was pushed publicly, assume it is compromised and rotate it outside Git:

### Rotate immediately

1. MongoDB Atlas user password and connection string
2. `JWT_SECRET`
3. `REFRESH_TOKEN_SECRET`
4. Any OAuth client secret (if one exists in the Google Cloud console)
5. Any Vercel / Render / CI deployment tokens or environment secrets

### Review but usually do not rotate

- Google OAuth client ID
- Supabase anon/public key

These are public-facing values, but you should still verify authorized origins, redirect URIs, bucket policies, and service health.

## Git History Warning

Removing files from the current commit is not enough if secrets were already pushed to GitHub. To fully clean a public repository:

1. Rotate the exposed credentials first
2. Rewrite Git history with a tool such as `git filter-repo` or BFG Repo-Cleaner
3. Force-push the cleaned history
4. Invalidate old credentials everywhere they were used

## Safe Deployment Rules

- Store backend secrets only in Render environment variables
- Store public frontend config only in Vercel `VITE_*` variables
- Never copy production `.env` files into the repo
- Never commit `dist/`, logs, or service account files
