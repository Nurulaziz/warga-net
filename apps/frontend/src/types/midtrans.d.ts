// Midtrans Snap.js type declaration
interface SnapCallbacks {
  onSuccess?: (result: any) => void;
  onPending?: (result: any) => void;
  onError?: (result: any) => void;
  onClose?: () => void;
}

interface Snap {
  pay: (token: string, callbacks?: SnapCallbacks) => void;
  hide: () => void;
}

interface Window {
  snap: Snap;
}
