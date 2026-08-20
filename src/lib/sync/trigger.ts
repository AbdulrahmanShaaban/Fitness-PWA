type Listener = () => void;

let listeners: Listener[] = [];

export function onSyncRequested(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function requestSync(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (e) {
      console.error("sync listener failed", e);
    }
  }
}