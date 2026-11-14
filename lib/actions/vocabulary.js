'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { validateWordPayload, normalizeHeadword } from '@/lib/validation/vocabulary';

// ─── FAVORITES ───────────────────────────────────────────────────────────────

/**
 * Toggle a core word favorite for the authenticated user.
 */
export async function toggleFavoriteAction(wordId, isCurrent) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  if (isCurrent) {
    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('word_id', wordId);
  } else {
    await supabase
      .from('user_favorites')
      .insert({ user_id: user.id, word_id: wordId });
  }

  revalidatePath('/words');
  return { success: true };
}

/**
 * Toggle a custom word favorite.
 */
export async function toggleCustomFavoriteAction(customWordId, isCurrent) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  if (isCurrent) {
    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('custom_word_id', customWordId);
  } else {
    await supabase
      .from('user_favorites')
      .insert({ user_id: user.id, custom_word_id: customWordId });
  }

  revalidatePath('/words/personal');
  return { success: true };
}

// ─── PERSONAL VOCABULARY ─────────────────────────────────────────────────────

/**
 * Create a new personal custom word.
 */
export async function createCustomWordAction(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const payload = {
    headword: formData.get('headword')?.toString() || '',
    translation: formData.get('translation')?.toString() || '',
    part_of_speech: formData.get('part_of_speech')?.toString() || '',
    definition: formData.get('definition')?.toString() || '',
    example_en: formData.get('example_en')?.toString() || '',
    example_bg: formData.get('example_bg')?.toString() || '',
  };

  const { valid, errors } = validateWordPayload(payload);
  if (!valid) return { error: errors.join(' ') };

  const normalizedHeadword = normalizeHeadword(payload.headword);

  const { error } = await supabase.from('user_custom_words').insert({
    user_id: user.id,
    headword: payload.headword.trim(),
    normalized_headword: normalizedHeadword,
    part_of_speech: payload.part_of_speech,
    translation: payload.translation.trim(),
    accepted_translations: [],
    definition: payload.definition.trim() || null,
    example_en: payload.example_en.trim() || null,
    example_bg: payload.example_bg.trim() || null,
    is_phrase: payload.headword.trim().includes(' '),
  });

  if (error) return { error: error.message };

  revalidatePath('/words/personal');
  redirect('/words/personal');
}

/**
 * Update an existing personal custom word.
 */
export async function updateCustomWordAction(customWordId, formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const payload = {
    headword: formData.get('headword')?.toString() || '',
    translation: formData.get('translation')?.toString() || '',
    part_of_speech: formData.get('part_of_speech')?.toString() || '',
    definition: formData.get('definition')?.toString() || '',
    example_en: formData.get('example_en')?.toString() || '',
    example_bg: formData.get('example_bg')?.toString() || '',
  };

  const { valid, errors } = validateWordPayload(payload);
  if (!valid) return { error: errors.join(' ') };

  const { error } = await supabase
    .from('user_custom_words')
    .update({
      headword: payload.headword.trim(),
      normalized_headword: normalizeHeadword(payload.headword),
      part_of_speech: payload.part_of_speech,
      translation: payload.translation.trim(),
      definition: payload.definition.trim() || null,
      example_en: payload.example_en.trim() || null,
      example_bg: payload.example_bg.trim() || null,
      is_phrase: payload.headword.trim().includes(' '),
      updated_at: new Date().toISOString(),
    })
    .eq('id', customWordId)
    .eq('user_id', user.id); // RLS + explicit user check

  if (error) return { error: error.message };

  revalidatePath('/words/personal');
  redirect('/words/personal');
}

/**
 * Delete a personal custom word.
 */
export async function deleteCustomWordAction(customWordId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { error } = await supabase
    .from('user_custom_words')
    .delete()
    .eq('id', customWordId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/words/personal');
  return { success: true };
}

// ─── WORD SUBMISSIONS ─────────────────────────────────────────────────────────

/**
 * Submit a new word proposal for the public dictionary.
 */
export async function submitWordProposalAction(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const payload = {
    headword: formData.get('headword')?.toString() || '',
    translation: formData.get('translation')?.toString() || '',
    part_of_speech: formData.get('part_of_speech')?.toString() || '',
    definition: formData.get('definition')?.toString() || '',
    example_en: formData.get('example_en')?.toString() || '',
    example_bg: formData.get('example_bg')?.toString() || '',
    explanation: formData.get('explanation')?.toString() || '',
  };

  const { valid, errors } = validateWordPayload(payload);
  if (!valid) return { error: errors.join(' ') };

  // Duplicate check: does this word + PoS already exist in the public dictionary?
  const norm = normalizeHeadword(payload.headword);
  const { data: existing } = await supabase
    .from('words')
    .select('id')
    .eq('normalized_headword', norm)
    .eq('part_of_speech', payload.part_of_speech)
    .single();

  if (existing) {
    return {
      error: `The word "${payload.headword.trim()}" (${payload.part_of_speech}) already exists in the core dictionary.`,
    };
  }

  // Pending duplicate check
  const { data: pendingDup } = await supabase
    .from('word_submissions')
    .select('id')
    .eq('headword', payload.headword.trim())
    .eq('part_of_speech', payload.part_of_speech)
    .eq('status', 'PENDING')
    .single();

  if (pendingDup) {
    return { error: 'An identical submission is already pending admin review.' };
  }

  const { error } = await supabase.from('word_submissions').insert({
    user_id: user.id,
    headword: payload.headword.trim(),
    part_of_speech: payload.part_of_speech,
    translation: payload.translation.trim(),
    definition: payload.definition.trim() || null,
    example_en: payload.example_en.trim() || null,
    example_bg: payload.example_bg.trim() || null,
    explanation: payload.explanation.trim() || null,
    status: 'PENDING',
  });

  if (error) return { error: error.message };

  revalidatePath('/words/add');
  return { success: 'Your word proposal has been submitted! An admin will review it shortly.' };
}

