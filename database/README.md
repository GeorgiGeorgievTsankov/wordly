# Wordly Database & Administration Guide

## Database Schema Overview
The database is fully normalized and follows strict Row Level Security (RLS) standards.

### Core Tables
1. `profiles` - Extended user profiles linked to `auth.users` with automated trigger creation.
2. `words` - Core dictionary entries, unique by `(normalized_headword, part_of_speech)`.
3. `word_meanings` - Translations, definitions, and examples per word.
4. `categories` & `word_categories` - Many-to-many topic and part-of-speech categorization.
5. `collections` & `collection_words` - Curated thematic collections.
6. `user_custom_words` - Unlimited private user vocabulary.
7. `word_submissions` - Community proposals requiring admin approval.
8. `user_favorites` - Bookmarked core or custom vocabulary.
9. `user_word_progress` - SM-2 spaced repetition state (repetitions, interval, ease_factor, due date).
10. `study_sessions` - Session performance and server-verified XP.
11. `review_logs` - Per-word recall audit logs.
12. `xp_events` - Idempotent, tamper-proof XP history.
13. `achievements` & `user_achievements` - Gamification milestones.
14. `daily_activity` - Daily study minutes and streak tracking in user's timezone.
15. `import_batches` - Admin import tracking for CSV / JSON batches.

---

## Security & Role Protection
- Non-admin users **CANNOT** elevate their role or modify anyone else's role (enforced by `protect_profile_role` trigger).
- Core dictionary modifications require `is_admin() = true`.
- Personal words and progress records are strictly isolated to `auth.uid() = user_id`.

---

## How to Assign the First Administrator
Since there is no public UI route to grant admin privileges, the initial administrator must be granted directly via SQL:

```sql
-- 1. Find your user ID by email
SELECT id, email, created_at FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Promote to admin in public.profiles
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'PASTE-USER-UUID-HERE';

-- 3. Verify the role change
SELECT id, username, display_name, role FROM public.profiles WHERE id = 'PASTE-USER-UUID-HERE';
```

