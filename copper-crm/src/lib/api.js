const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function makeNetworkError(message) {
  const err = new Error(message);
  err.isNetworkError = true;
  return err;
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    // Hard network failure (no proxy, DNS failure, etc.)
    throw makeNetworkError("Backend unavailable — working in demo mode.");
  }

  // Proxy/gateway errors — Vite dev proxy returns 502/503/504/500 with HTML when backend is down
  if (response.status >= 500) {
    const text = await response.text().catch(() => "");
    // If the body is HTML (not JSON), it's a proxy error, not a real server error
    if (text.trim().startsWith("<") || text === "") {
      throw makeNetworkError("Backend unavailable — working in demo mode.");
    }
    // Real server 5xx with JSON body — parse and throw normally
    try {
      const data = JSON.parse(text);
      throw new Error(data.message || "Something went wrong.");
    } catch (parseErr) {
      if (parseErr.isNetworkError) throw parseErr;
      throw new Error("Something went wrong.");
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

export function apiPost(path, body, token) {
  return request(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}

export function apiGet(path, token) {
  return request(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}

export function apiPut(path, body, token) {
  return request(path, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}

export function apiDelete(path, token) {
  return request(path, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}
