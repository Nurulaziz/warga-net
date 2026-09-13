// Midtrans Snap.js type declaration
interface SnapCallbacks {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
}

interface SnapEmbedCallbacks extends SnapCallbacks {
  embedId: string;
}

interface Snap {
  pay: (token: string, callbacks?: SnapCallbacks) => void;
  embed: (token: string, callbacks: SnapEmbedCallbacks) => void;
  hide?: () => void;
}

interface Window {
  snap?: Snap;
}
