const OIDC_ISSUER_URL = import.meta.env.VITE_OIDC_ISSUER_URL || '';
const OIDC_CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID || '';
const OIDC_REDIRECT_URI =
  import.meta.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/auth/callback`;
const OIDC_SCOPES = import.meta.env.VITE_OIDC_SCOPES || 'openid profile email roles';

const ACCESS_TOKEN_KEY = 'questify.oidc.access_token';
const ID_TOKEN_KEY = 'questify.oidc.id_token';
const REFRESH_TOKEN_KEY = 'questify.oidc.refresh_token';
const EXPIRES_AT_KEY = 'questify.oidc.expires_at';
const PKCE_VERIFIER_KEY = 'questify.oidc.pkce_verifier';
const STATE_KEY = 'questify.oidc.state';
const POST_LOGIN_REDIRECT_KEY = 'questify.oidc.post_login_redirect';

interface TokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

export class OidcAuthenticationError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'OidcAuthenticationError';
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function base64UrlEncode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

function randomString() {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
}

export function isOidcEnabled() {
  return Boolean(OIDC_ISSUER_URL && OIDC_CLIENT_ID);
}

export async function getAccessToken() {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const expiresAt = Number(sessionStorage.getItem(EXPIRES_AT_KEY) || '0');
  if (token && Date.now() < expiresAt - 30_000) {
    return token;
  }

  return refreshOidcSession();
}

export function clearOidcSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ID_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(EXPIRES_AT_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
}

function storeTokens(tokens: TokenResponse) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  if (tokens.id_token) {
    sessionStorage.setItem(ID_TOKEN_KEY, tokens.id_token);
  }
  if (tokens.refresh_token) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }
  sessionStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + (tokens.expires_in ?? 300) * 1000));
}

async function requestToken(body: URLSearchParams) {
  const issuer = trimTrailingSlash(OIDC_ISSUER_URL);
  const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    throw new OidcAuthenticationError();
  }

  return (await response.json()) as TokenResponse;
}

export async function loginWithOidcPassword(username: string, password: string) {
  if (!isOidcEnabled()) {
    throw new Error('OIDC is not configured');
  }

  clearOidcSession();
  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: 'password',
      client_id: OIDC_CLIENT_ID,
      username,
      password,
      scope: OIDC_SCOPES,
    })
  );
  storeTokens(tokens);
}

export async function refreshOidcSession() {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken || !isOidcEnabled()) {
    return null;
  }

  try {
    const tokens = await requestToken(
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: OIDC_CLIENT_ID,
        refresh_token: refreshToken,
      })
    );
    storeTokens(tokens);
    return tokens.access_token;
  } catch {
    clearOidcSession();
    return null;
  }
}

export async function startOidcLogin(returnTo = window.location.pathname + window.location.search) {
  if (!isOidcEnabled()) {
    throw new Error('OIDC is not configured');
  }

  const verifier = randomString();
  const state = randomString();
  const challenge = base64UrlEncode(await sha256(verifier));

  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, returnTo || '/');

  const issuer = trimTrailingSlash(OIDC_ISSUER_URL);
  const params = new URLSearchParams({
    client_id: OIDC_CLIENT_ID,
    redirect_uri: OIDC_REDIRECT_URI,
    response_type: 'code',
    scope: OIDC_SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.assign(`${issuer}/protocol/openid-connect/auth?${params.toString()}`);
}

export async function completeOidcLogin(search = window.location.search) {
  const params = new URLSearchParams(search);
  const code = params.get('code');
  const state = params.get('state');
  const expectedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);

  if (!code || !state || state !== expectedState || !verifier) {
    throw new Error('Invalid OIDC callback');
  }

  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: OIDC_CLIENT_ID,
      redirect_uri: OIDC_REDIRECT_URI,
      code,
      code_verifier: verifier,
    })
  );

  storeTokens(tokens);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);

  const returnTo = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) || '/';
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  return returnTo;
}
