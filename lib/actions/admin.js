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

/**
 * Bulk imports words from JSON or parsed CSV.
 * Validates, handles duplicates, and logs to import_batches.
 */
export async function importWordsBatchAction({ filename, format, rows = [] }) {
  const supabase = await createClient();

  try {
    const adminUser = await assertAdmin(supabase);

    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errorDetails = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const validation = validateWordPayload(r);
        if (!validation.isValid) {
          errorCount += 1;
          errorDetails.push({ row: i + 1, error: Object.values(validation.errors).join(', ') });
          continue;
        }

        const normHeadword = normalizeHeadword(r.headword);

        // Check duplicate (normalized_headword, part_of_speech)
        const { data: existing } = await supabase
          .from('words')
          .select('id')
          .eq('normalized_headword', normHeadword)
          .eq('part_of_speech', r.part_of_speech)
          .maybeSingle();

        if (existing) {
          duplicateCount += 1;
          continue;
        }

        // Insert word
        const { data: newWord, error: wordErr } = await supabase
          .from('words')
          .insert({
            headword: r.headword.trim(),
            normalized_headword: normHeadword,
            part_of_speech: r.part_of_speech,
            phonetic_transcription: r.phonetic_transcription || null,
            difficulty: r.difficulty || 'A1',
            status: r.translation ? 'published' : 'needs_translation',
          })
          .select('id')
          .single();

        if (wordErr) throw wordErr;

        // Insert meaning if translation provided
        if (r.translation) {
          await supabase.from('word_meanings').insert({
            word_id: newWord.id,
            translation: r.translation.trim(),
            definition: r.definition || null,
            example_sentence: r.example_sentence || null,
            example_translation: r.example_translation || null,
          });
        }

        importedCount += 1;
      } catch (rowErr) {
        errorCount += 1;
        errorDetails.push({ row: i + 1, error: rowErr.message });
      }
    }

    // Record import_batches row
    await supabase.from('import_batches').insert({
      admin_id: adminUser.id,
      filename: filename || 'manual_import',
      format: format || 'json',
      imported_count: importedCount,
      updated_count: 0,
      duplicate_count: duplicateCount,
      skipped_count: 0,
      error_count: errorCount,
      error_details: errorDetails,
    });

    revalidatePath('/words');
    revalidatePath('/admin');

    return {
      success: true,
      summary: {
        imported: importedCount,
        duplicates: duplicateCount,
        errors: errorCount,
      },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

