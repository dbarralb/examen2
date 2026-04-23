const firebaseBaseUrl = "https://project-butterfly-d0242-default-rtdb.firebaseio.com";

export function firebaseUrl(path = "") {
  const normalizedPath = path ? `/${path}` : "/";
  return `${firebaseBaseUrl}${normalizedPath}.json`;
}

export async function firebaseGet(path = "") {
  const response = await fetch(firebaseUrl(path), { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Firebase GET failed: ${response.status}`);
  }

  return response.json();
}

export async function firebasePut(path = "", data) {
  const response = await fetch(firebaseUrl(path), {
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
  const response = await fetch(firebaseUrl(path), {
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
  const response = await fetch(firebaseUrl(path), {
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
  const response = await fetch(firebaseUrl(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Firebase PATCH failed: ${response.status}`);
  }

  return response.json();
}
