const CLIENT_ID_STORAGE_KEY = "elExamen2.clientId";

export function createId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function getOrCreateClientId() {
  try {
    const stored = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);

    if (stored) {
      return stored;
    }

    const created = createId();
    window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, created);
    return created;
  } catch (error) {
    return createId();
  }
}

export function generateSessionAccessCode() {
  if (window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return String(100000 + (values[0] % 900000));
  }

  return String(Math.floor(100000 + Math.random() * 900000));
}
