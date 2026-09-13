import { describe, expect, it } from 'vitest';
import { getPageMeta } from './page-meta';

describe('page metadata', () => {
  it('shows the appearance settings breadcrumb', () => {
    expect(getPageMeta('/settings/appearance')).toEqual({
      title: 'Tampilan',
      group: 'Pengaturan',
    });
  });
});
