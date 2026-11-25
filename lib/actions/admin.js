'use server';

import { createClient } from '@/lib/supabase/server';
import { normalizeHeadword, validateWordPayload } from '@/lib/validation/vocabulary';
import { revalidatePath } from 'next/cache';

/**
 * Asserts that the currently logged-in user is an administrator.
 */
async function assertAdmin(supabase) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Forbidden: Administrator access required.');
  }

  return user;
}

/**
 * Fetches high-level metrics for the Admin Dashboard.
 */
export async function getAdminMetricsAction() {
  const supabase = await createClient();

  try {
    await assertAdmin(supabase);

    const [usersRes, wordsRes, submissionsRes, customWordsRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('words').select('*', { count: 'exact', head: true }),
      supabase.from('word_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('user_custom_words').select('*', { count: 'exact', head: true }),
    ]);

    return {
      success: true,
      metrics: {
        totalUsers: usersRes.count || 0,
        totalWords: wordsRes.count || 0,
        pendingSubmissions: submissionsRes.count || 0,
        totalCustomWords: customWordsRes.count || 0,
      },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetches pending submissions for admin moderation.
 */
export async function getAdminSubmissionsAction() {
  const supabase = await createClient();

  try {
    await assertAdmin(supabase);

    const { data, error } = await supabase
      .from('word_submissions')
      .select(`
        id,
        user_id,
        headword,
        part_of_speech,
        translation,
        definition,
        example_sentence,
        example_translation,
        status,
        created_at,
        profiles (display_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, submissions: data || [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Moderates a submission: approves atomically via database function or rejects.
 */
export async function moderateSubmissionAction({ submissionId, action, rejectionReason }) {
  const supabase = await createClient();

  try {
    const adminUser = await assertAdmin(supabase);

    if (action === 'approve') {
      // Call atomic SECURITY DEFINER DB function
      const { data, error } = await supabase.rpc('approve_word_submission', {
        sub_id: submissionId,
        reviewer_id: adminUser.id,
      });

      if (error) throw error;
      revalidatePath('/admin/submissions');
      revalidatePath('/words');
      return { success: true, wordId: data };
    } else {
      // Reject
      const { error } = await supabase
        .from('word_submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason || 'Does not meet dictionary guidelines',
          reviewed_by: adminUser.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;
      revalidatePath('/admin/submissions');
      return { success: true };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Deletes a word from the core dictionary.
 */
export async function deleteAdminWordAction(wordId) {
  const supabase = await createClient();

  try {
    await assertAdmin(supabase);

    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', wordId);

    if (error) throw error;

    revalidatePath('/admin/words');
    revalidatePath('/words');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function normalizeDifficulty(val) {
  if (!val) return 'beginner';
  const lower = String(val).toLowerCase().trim();
  if (['a1', 'a2', 'beginner', 'easy'].includes(lower)) return 'beginner';
  if (['b1', 'b2', 'intermediate', 'medium'].includes(lower)) return 'intermediate';
  if (['c1', 'c2', 'advanced', 'hard'].includes(lower)) return 'advanced';
  return 'beginner';
}

/**
 * Bulk imports words from CSV or JSON.
 * Validates, handles duplicates & multi-meanings, links categories, and logs to import_batches.
 */
export async function importWordsBatchAction({ filename, format = 'csv', rows = [] }) {
  const supabase = await createClient();

  try {
    const adminUser = await assertAdmin(supabase);

    // 1. Fetch existing categories into lookup map
    const { data: allCategories } = await supabase
      .from('categories')
      .select('id, name, slug');

    const categoryMap = new Map();
    for (const cat of allCategories || []) {
      categoryMap.set(cat.slug.toLowerCase(), cat.id);
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    }

    let importedWordsCount = 0;
    let updatedWordsCount = 0;
    let meaningsCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errorDetails = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const rawHeadword = (r.headword || '').trim();
        const rawTranslation = (r.translation || '').trim();

        if (!rawHeadword || !rawTranslation) {
          errorCount += 1;
          errorDetails.push({ row: i + 1, error: 'Both English headword and Bulgarian translation are required.' });
          continue;
        }

        const normHeadword = normalizeHeadword(rawHeadword);
        const pos = (r.part_of_speech || 'noun').toLowerCase().trim();
        const diff = normalizeDifficulty(r.difficulty);

        // Parse accepted_translations
        let accepted = [];
        if (Array.isArray(r.accepted_translations)) {
          accepted = r.accepted_translations.map((s) => String(s).trim()).filter(Boolean);
        } else if (typeof r.accepted_translations === 'string' && r.accepted_translations.trim()) {
          accepted = r.accepted_translations
            .split(/[|,]/)
            .map((s) => s.trim())
            .filter(Boolean);
        }

        // 1. Check if word already exists in words table
        let wordId = null;
        const { data: existingWord } = await supabase
          .from('words')
          .select('id')
          .eq('normalized_headword', normHeadword)
          .eq('part_of_speech', pos)
          .maybeSingle();

        if (existingWord) {
          wordId = existingWord.id;
          updatedWordsCount += 1;
        } else {
          // Insert new word
          const { data: newWord, error: wordErr } = await supabase
            .from('words')
            .insert({
              headword: rawHeadword,
              normalized_headword: normHeadword,
              part_of_speech: pos,
              difficulty: diff,
              status: 'active',
              source: r.source || filename || 'admin_import',
              source_rank: r.source_rank ? parseInt(r.source_rank, 10) : null,
            })
            .select('id')
            .single();

          if (wordErr) throw wordErr;
          wordId = newWord.id;
          importedWordsCount += 1;
        }

        // 2. Link category
        let targetCatId = null;
        if (r.category) {
          targetCatId = categoryMap.get(r.category.toLowerCase().trim()) || null;
        }
        if (!targetCatId) {
          // Auto-match by part of speech (e.g. noun -> nouns, verb -> verbs)
          const pluralPos = pos.endsWith('s') ? pos : `${pos}s`;
          targetCatId = categoryMap.get(pluralPos) || categoryMap.get(pos) || null;
        }

        if (targetCatId && wordId) {
          await supabase
            .from('word_categories')
            .upsert({ word_id: wordId, category_id: targetCatId }, { onConflict: 'word_id,category_id' });
        }

        // 3. Insert meaning if not an exact duplicate
        const { data: existingMeaning } = await supabase
          .from('word_meanings')
          .select('id')
          .eq('word_id', wordId)
          .eq('translation', rawTranslation)
          .maybeSingle();

        if (!existingMeaning) {
          // Get current meaning count for sort_order
          const { count } = await supabase
            .from('word_meanings')
            .select('*', { count: 'exact', head: true })
            .eq('word_id', wordId);

          const exEn = r.example_en || r.example_sentence || null;
          const exBg = r.example_bg || r.example_translation || null;

          await supabase.from('word_meanings').insert({
            word_id: wordId,
            translation: rawTranslation,
            accepted_translations: accepted,
            definition: r.definition ? r.definition.trim() : null,
            example_en: exEn ? exEn.trim() : null,
            example_bg: exBg ? exBg.trim() : null,
            sort_order: count || 0,
          });
          meaningsCount += 1;
        } else {
          duplicateCount += 1;
        }
      } catch (rowErr) {
        errorCount += 1;
        errorDetails.push({ row: i + 1, error: rowErr.message });
      }
    }

    // 4. Record batch in import_batches
    await supabase.from('import_batches').insert({
      admin_id: adminUser.id,
      filename: filename || 'manual_import',
      format: format || 'csv',
      imported_count: importedWordsCount,
      updated_count: updatedWordsCount,
      duplicate_count: duplicateCount,
      skipped_count: 0,
      error_count: errorCount,
      error_details: errorDetails,
    });

    revalidatePath('/words');
    revalidatePath('/admin');
    revalidatePath('/learn');

    return {
      success: true,
      summary: {
        importedWords: importedWordsCount,
        updatedWords: updatedWordsCount,
        meaningsAdded: meaningsCount,
        duplicates: duplicateCount,
        errors: errorCount,
        errorDetails: errorDetails.slice(0, 10), // return first 10 errors if any
      },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

