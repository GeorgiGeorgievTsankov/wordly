import { createClient } from '@/lib/supabase/server';

const PAGE_SIZE = 30;

/**
 * Fetch paginated core dictionary words with optional search + filters.
 * Returns { words, total, page, totalPages }
 */
export async function getWords({ search = '', pos = '', difficulty = '', categorySlug = '', page = 1 } = {}) {
  const supabase = await createClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('words')
    .select(
      `id, headword, normalized_headword, part_of_speech, difficulty, pronunciation, is_phrase, status,
       word_meanings ( id, translation, definition, example_en, example_bg, sort_order )`,
      { count: 'exact' }
    )
    .eq('status', 'active')
    .order('headword', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (search) {
    query = query.or(
      `headword.ilike.%${search}%,normalized_headword.ilike.%${search}%`
    );
  }

  if (pos) {
    query = query.eq('part_of_speech', pos);
  }

  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  if (categorySlug) {
    // Filter through word_categories → categories
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (cat) {
      const { data: wc } = await supabase
        .from('word_categories')
        .select('word_id')
        .eq('category_id', cat.id);

      const ids = (wc || []).map((r) => r.word_id);
      if (ids.length === 0) {
        return { words: [], total: 0, page, totalPages: 0 };
      }
      query = query.in('id', ids);
    }
  }

  const { data: words, count, error } = await query;

  if (error) throw new Error(error.message);

  return {
    words: words || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE),
  };
}

/**
 * Fetch a single word with its meanings, categories, and user progress (if userId given).
 */
export async function getWordById(wordId, userId = null) {
  const supabase = await createClient();

  const { data: word, error } = await supabase
    .from('words')
    .select(`
      *,
      word_meanings ( * ),
      word_categories ( category_id, categories ( id, name, slug ) )
    `)
    .eq('id', wordId)
    .single();

  if (error || !word) return null;

  let progress = null;
  let isFavorite = false;

  if (userId) {
    const { data: prog } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('word_id', wordId)
      .single();
    progress = prog;

    const { data: fav } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('word_id', wordId)
      .single();
    isFavorite = !!fav;
  }

  return { ...word, progress, isFavorite };
}

/**
 * Fetch all categories.
 */
export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get user's custom words with optional search, paginated.
 */
export async function getCustomWords(userId, { search = '', pos = '', page = 1 } = {}) {
  const supabase = await createClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('user_custom_words')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (search) {
    query = query.or(`headword.ilike.%${search}%,translation.ilike.%${search}%`);
  }

  if (pos) {
    query = query.eq('part_of_speech', pos);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    words: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE),
  };
}

/**
 * Get user's favorite word IDs for a list of word ids.
 */
export async function getFavoriteWordIds(userId) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_favorites')
    .select('word_id, custom_word_id')
    .eq('user_id', userId);
  return data || [];
}

/**
 * Get user's word submissions.
 */
export async function getUserSubmissions(userId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('word_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Search translations for quiz distractor generation (needs_translation words excluded).
 * Returns up to `count` random translations different from the target.
 */
export async function getRandomTranslations(excludeWordId, count = 3) {
  const supabase = await createClient();
  // Fetch a pool of random meanings, exclude the target word
  const { data } = await supabase
    .from('word_meanings')
    .select('translation, word_id')
    .neq('word_id', excludeWordId)
    .limit(count * 10);

  if (!data || data.length === 0) return [];

  // Shuffle and take `count` unique translations
  const shuffled = data.sort(() => Math.random() - 0.5);
  const unique = [];
  const seen = new Set();
  for (const row of shuffled) {
    if (!seen.has(row.translation)) {
      seen.add(row.translation);
      unique.push(row.translation);
      if (unique.length >= count) break;
    }
  }
  return unique;
}
