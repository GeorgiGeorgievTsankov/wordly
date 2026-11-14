'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server action to sign in with email and password
 */
export async function signInAction(formData) {
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

/**
 * Server action to register a new user
 */
export async function signUpAction(formData) {
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();
  const username = formData.get('username')?.toString().trim();
  const displayName = formData.get('displayName')?.toString().trim() || username;
  const dailyGoal = parseInt(formData.get('dailyGoal')?.toString() || '10', 10);

  if (!email || !password) {
    return { error: 'Please provide email and password.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  if (username && !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return { error: 'Username must be 3-30 characters (letters, numbers, underscores only).' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || splitEmail(email),
        display_name: displayName,
        daily_goal: dailyGoal,
        timezone: 'Europe/Sofia',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

/**
 * Server action to sign out
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Server action for forgot password request
 */
export async function forgotPasswordAction(formData) {
  const email = formData.get('email')?.toString().trim();

  if (!email) {
    return { error: 'Please enter your email address.' };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/settings`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Password reset link sent! Check your inbox.' };
}

function splitEmail(email) {
  return email.split('@')[0] || 'user';
}
