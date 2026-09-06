import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { useDismissibleLayer } from './useDismissibleLayer';

function TestMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const { rootRef, triggerRef } = useDismissibleLayer(open, () => setOpen(false));
  return (
    <div ref={rootRef}>
      <button ref={triggerRef} onClick={() => setOpen((value) => !value)}>{name}</button>
      {open && <div role="menu">Menu {name}</div>}
    </div>
  );
}

describe('useDismissibleLayer', () => {
  it('menutup menu ketika area di luar diklik', () => {
    render(<><TestMenu name="Aksi" /><button>Area luar</button></>);
    fireEvent.click(screen.getByRole('button', { name: 'Aksi' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Area luar' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('menutup dengan Escape dan mengembalikan fokus ke pemicu', () => {
    render(<TestMenu name="Aksi" />);
    const trigger = screen.getByRole('button', { name: 'Aksi' });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('menutup menu sebelumnya ketika menu lain dibuka', () => {
    render(<><TestMenu name="Pertama" /><TestMenu name="Kedua" /></>);
    fireEvent.click(screen.getByRole('button', { name: 'Pertama' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kedua' }));
    expect(screen.queryByText('Menu Pertama')).not.toBeInTheDocument();
    expect(screen.getByText('Menu Kedua')).toBeInTheDocument();
  });
});
