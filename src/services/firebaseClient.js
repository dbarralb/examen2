import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseBaseUrl =
  import.meta.env.VITE_FIREBASE_DATABASE_URL ||
  "https://project-butterfly-d0242-default-rtdb.firebaseio.com";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: firebaseBaseUrl,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseAuthConfig =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

let authUserPromise = null;

async function getFirebaseAuthToken() {
  if (!hasFirebaseAuthConfig) {
    return null;
  }

  if (!authUserPromise) {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authUserPromise = signInAnonymously(getAuth(app)).then(({ user }) => user);
  }

  const user = await authUserPromise;
  return user.getIdToken();
}

export function firebaseUrl(path = "", authToken = null) {
  const normalizedPath = path ? `/${path}` : "/";
  const url = new URL(`${firebaseBaseUrl}${normalizedPath}.json`);

  if (authToken) {
    url.searchParams.set("auth", authToken);
  }

  return url.toString();
}

export async function firebaseGet(path = "") {
  const authToken = await getFirebaseAuthToken();
  const response = await fetch(firebaseUrl(path, authToken), { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Firebase GET failed: ${response.status}`);
  }

  return response.json();
}

export async function firebasePut(path = "", data) {
  const authToken = await getFirebaseAuthToken();
  const response = await fetch(firebaseUrl(path, authToken), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Firebase PUT failed: ${response.status}`);
  }

  return response.json();
}

export async function firebaseGetWithEtag(path = "") {
  const authToken = await getFirebaseAuthToken();
  const response = await fetch(firebaseUrl(path, authToken), {
    cache: "no-store",
    headers: { "X-Firebase-ETag": "true" },
  });

  if (!response.ok) {
    throw new Error(`Firebase GET ETag failed: ${response.status}`);
  }

  return {
    data: await response.json(),
    etag: response.headers.get("ETag"),
  };
}

export async function firebasePutIfMatch(path = "", data, etag) {
  const authToken = await getFirebaseAuthToken();
  const response = await fetch(firebaseUrl(path, authToken), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "If-Match": etag || "",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 412) {
    return { ok: false, data: null };
  }

  if (!response.ok) {
    throw new Error(`Firebase conditional PUT failed: ${response.status}`);
  }

  return { ok: true, data: await response.json() };
}

export async function firebasePatch(path = "", data) {
  const authToken = await getFirebaseAuthToken();
  const response = await fetch(firebaseUrl(path, authToken), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Firebase PATCH failed: ${response.status}`);
  }

  return response.json();
}
