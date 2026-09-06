import { useEffect, useId, useRef } from 'react';

const OPEN_EVENT = 'warganet:dismissible-layer-open';

/** Shared behavior for non-modal menus, popovers, and listboxes. */
export function useDismissibleLayer(open: boolean, onDismiss: () => void) {
  const layerId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!open) return;

    // Opening a layer closes every other open layer in the application.
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: layerId }));

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        dismissRef.current();
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dismissRef.current();
      triggerRef.current?.focus();
    }

    function handleAnotherLayer(event: Event) {
      if ((event as CustomEvent<string>).detail !== layerId) dismissRef.current();
    }

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener(OPEN_EVENT, handleAnotherLayer);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(OPEN_EVENT, handleAnotherLayer);
    };
  }, [layerId, open]);

  return { rootRef, triggerRef };
}
