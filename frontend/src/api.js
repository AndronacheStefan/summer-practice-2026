// Central API client.
//
// Every authenticated request goes through apiFetch, which:
//   1. attaches the JWT (issued at login) as an `Authorization: Bearer` header, and
//   2. reacts to a 401 by clearing client auth state and sending the user to the
//      login page, preserving where they were so login can send them back.
//
// The login request itself must NOT use this helper: it has no token yet, and a
// 401 there means "bad credentials", not "session expired".

export function getToken() {
    return sessionStorage.getItem("access_token");
}

export function isAuthenticated() {
    return Boolean(getToken());
}

export function clearAuth() {
    sessionStorage.clear();
}

function redirectToLogin() {
    clearAuth();
    const { pathname, search } = window.location;
    const alreadyOnLogin = pathname === "/" || pathname.startsWith("/login");
    if (alreadyOnLogin) {
        window.location.assign("/login");
        return;
    }
    // Remember where the user was so login can return them there.
    const from = encodeURIComponent(pathname + search);
    window.location.assign(`/login?from=${from}`);
}

/**
 * fetch wrapper that adds auth and handles 401 centrally.
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(path, { ...options, headers });

    if (response.status === 401) {
        // Token missing / expired / invalid — bail out to login.
        redirectToLogin();
        throw new Error("Unauthorized");
    }

    return response;
}
