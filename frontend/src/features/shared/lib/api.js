const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * JSON fetch client for the GridWise backend (no cookies or sessions)
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const base = (data && (data.message || data.error)) || `Request failed with status ${response.status}`;
      const details = Array.isArray(data?.details) ? `: ${data.details.slice(0, 3).join("; ")}` : "";
      const errorMsg = base + details;
      throw new ApiError(errorMsg, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or backend offline
    throw new ApiError(error.message || "Network error. Please ensure the backend is running at " + API_BASE_URL, 0);
  }
}

export const api = {
  get: (endpoint, options) => apiFetch(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiFetch(endpoint, { ...options, method: "DELETE" }),
};
