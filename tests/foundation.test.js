import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';
import { STRINGS } from '../lib/constants/strings';

describe('Wordly Foundation Tests', () => {
  it('cn helper combines classnames properly', () => {
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
    expect(cn('p-4', 'p-6')).toBe('p-6'); // tailwind-merge resolves conflicts
  });

  it('strings dictionary contains required UI labels in English', () => {
    expect(STRINGS.appName).toBe('Wordly');
    expect(STRINGS.nav.login).toBe('Sign In');
    expect(STRINGS.nav.register).toBe('Get Started Free');
    expect(STRINGS.features.items.length).toBeGreaterThanOrEqual(6);
  });
});
