# Wordly: Deployment Guide (Vercel & Supabase)

This document provides step-by-step instructions to deploy Wordly to production on Vercel.

---

## 1. Prerequisites

- A GitHub repository with the Wordly codebase (`https://github.com/GeorgiGeorgievTsankov/wordly.git`)
- A production Supabase project (Project ID: `pyntdniplspbqcztxsxw`)
- A [Vercel](https://vercel.com) account

---

## 2. Environment Variables

Configure the following environment variables in your Vercel Project Settings (**Settings → Environment Variables**):

| Variable | Description | Exposure | Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public (Client & Server) | `https://pyntdniplspbqcztxsxw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous public key | Public (Client & Server) | `ey...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret | **Private (Server ONLY)** | `ey...` |

> ⚠️ **SECURITY WARNING:** Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client or prefix it with `NEXT_PUBLIC_`.

---

## 3. Database & Migrations

The database schema is managed via SQL migrations located in `database/migrations/`:
- `001_initial_schema.sql` (Creates all 18 tables, indexes, functions, triggers, and Row Level Security policies)

Verify in your Supabase dashboard that RLS is active on all 18 tables:
- `profiles`, `words`, `word_meanings`, `categories`, `word_categories`, `collections`, `collection_words`, `user_custom_words`, `word_submissions`, `user_favorites`, `user_word_progress`, `study_sessions`, `review_logs`, `xp_events`, `achievements`, `user_achievements`, `daily_activity`, `import_batches`.

---

## 4. Admin Role Assignment

To assign the first administrator, run the following SQL query in the **Supabase SQL Editor**:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

---

## 5. Vercel Deployment Steps

1. In Vercel, click **"Add New..." → "Project"**.
2. Select your repository `wordly`.
3. Framework Preset: **Next.js** (detected automatically).
4. Root Directory: `./`
5. Add the Environment Variables from Section 2 above.
6. Click **Deploy**.
7. In Supabase Dashboard (**Authentication → URL Configuration**), set:
   - **Site URL**: `https://<your-vercel-domain>.vercel.app`
   - **Redirect URLs**: `https://<your-vercel-domain>.vercel.app/**`

