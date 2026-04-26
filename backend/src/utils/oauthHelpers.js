/**
 * Shared OAuth helper utilities used by the token-refresh cron and the
 * manual refresh controller. Extracted here so tests can import them directly.
 */

/**
 * Determines whether an OAuth token exchange error means the token is
 * permanently invalid (requires user re-auth) vs a transient failure
 * (network timeout, rate limit, server error) that we should retry later.
 *
 * Priority order:
 *   1. Check OAuth2 error string in the response body — most authoritative.
 *   2. Check the exception message (psn-api throws plain Error objects).
 *   3. Fall back to HTTP status code.
 *
 *   AUTH FAILURE  — known OAuth error string, OR any 4xx EXCEPT 404/408/429.
 *   TRANSIENT     — 5xx, 429, 408, 404, or no HTTP response (network down).
 */
export function isOAuthAuthFailure(err) {
    const oauthError = err?.response?.data?.error || err?.response?.data?.code || '';
    const OAUTH_AUTH_ERRORS = [
        'invalid_grant',
        'invalid_token',
        'token_expired',
        'access_denied',
        'unauthorized_client',
        'invalid_client',
        'account_disabled',
    ];

    // 1. Body error string
    if (OAUTH_AUTH_ERRORS.some(e => oauthError.toLowerCase().includes(e))) return true;

    // 2. Exception message string
    const msg = (err?.message || '').toLowerCase();
    if (OAUTH_AUTH_ERRORS.some(e => msg.includes(e))) return true;

    // 3. HTTP status
    const status = err?.response?.status;
    if (!status) return false;          // No HTTP response → network error → transient
    if (status >= 500) return false;    // 5xx → server down → transient
    if ([404, 408, 429].includes(status)) return false; // Specific transient 4xx
    if (status >= 400 && status < 500) return true;     // Any other 4xx → auth failure

    return false;
}

/**
 * Returns true if a stored token should be proactively renewed.
 * @param {Date|null} expiresAt       - Stored expiry date from the DB
 * @param {number}    daysBeforeExpiry - Renew when this many days remain
 */
export function needsRenewal(expiresAt, daysBeforeExpiry) {
    if (!expiresAt) return true; // No expiry stored — renew to be safe
    const msUntilExpiry = new Date(expiresAt).getTime() - Date.now();
    return msUntilExpiry < daysBeforeExpiry * 24 * 60 * 60 * 1000;
}
