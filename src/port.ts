/**
 * The auth wire shapes this domain consumes, declared locally. This package is the
 * consumer: it states the minimal shape of what the BFF returns and what it POSTs, so it
 * never has to import a contract package or couple to the auth client.
 */

/** A session the BFF returns after a successful social exchange. */
export interface Session {
  /** Signed JWT to put in `Authorization: Bearer`. */
  token: string;
  userId: string;
  expiresAt: string;
}

/** Social identity providers this domain supports. */
export type SocialProvider = "google" | "apple";

/**
 * What the client POSTs to the BFF's social route. The credential takes one of two shapes,
 * both verified server-side (the client_secret never leaves the BFF):
 *  - `code` (+ `codeVerifier`, `redirectUri`): OAuth authorization code from a browser/PKCE
 *    flow — typically Google via expo-auth-session.
 *  - `idToken` (+ `nonce`): an OpenID id_token from a native flow — typically Apple via
 *    expo-apple-authentication.
 */
export interface SocialLoginInput {
  provider: SocialProvider;
  code?: string;
  codeVerifier?: string;
  redirectUri?: string;
  idToken?: string;
  nonce?: string;
}

/**
 * The credential an authorizer produces — everything in the BFF request except `provider`.
 * Browser/PKCE flows fill `code`; native flows (Apple) fill `idToken`. The client is shape-
 * agnostic: it just forwards whatever the authorizer returns.
 */
export type SocialCredential = Omit<SocialLoginInput, "provider">;

/**
 * Runs one provider's device-side interaction and returns the credential to hand to the BFF.
 * Injected by the app so this package never depends on expo-auth-session /
 * expo-apple-authentication. Example (Google via PKCE): open the browser, complete the flow,
 * return `{ code, codeVerifier, redirectUri }`.
 */
export type SocialAuthorizer = () => Promise<SocialCredential>;

/**
 * The social-login domain on the client: run the provider flow, then exchange the credential
 * for a session at the BFF (which verifies it) and persist the token.
 */
export interface SocialClient {
  /** Authenticate with a provider; persists the session token on success. */
  login(provider: SocialProvider): Promise<Session>;
}
