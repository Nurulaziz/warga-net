import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('render teks children', () => {
    render(<Button>Simpan</Button>);
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeInTheDocument();
  });

  it('panggil onClick saat diklik', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Klik</Button>);
    await user.click(screen.getByRole('button', { name: 'Klik' }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('disable saat loading', () => {
    render(<Button loading>Simpan</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('disable saat prop disabled', () => {
    render(<Button disabled>Simpan</Button>);
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeDisabled();
  });

  it('render variant primary sebagai default', () => {
    render(<Button>Teks</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-blue-600');
  });

  it('render variant danger', () => {
    render(<Button variant="danger">Hapus</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-red-600');
  });

  it('render fullWidth', () => {
    render(<Button fullWidth>Full</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('w-full');
  });
});
