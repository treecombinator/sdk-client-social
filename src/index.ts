import { TcError } from "@treecombinator/sdk-common";
import type { Session, SocialAuthorizer, SocialClient, SocialProvider } from "./port";

/** The BFF route this domain exchanges a social credential against. */
const SOCIAL_ROUTE = "/auth/social";

/**
 * The transport this domain composes, taken as an injected object with the one method it
 * uses. Declared inline so this package depends on no http package — the app passes its
 * own client (typically a tiny typed fetch wrapper to the BFF).
 */
export interface SocialHttp {
  post<T = unknown>(path: string, body?: unknown): Promise<T>;
}

/**
 * Social login on the client. The app injects one authorizer per provider it supports
 * (wrapping expo-auth-session for Google, expo-apple-authentication for Apple); this domain
 * runs the chosen flow and exchanges the credential for a session at the BFF, then hands the
 * session token to the injected `setToken` so it lands in the same store the rest of the SDK
 * reads from.
 *
 * ```ts
 * const social = createSocialClient({
 *   http,
 *   setToken: (token) => store.set(token), // persist where the auth client reads it
 *   authorizers: {
 *     google: async () => ({ code, codeVerifier, redirectUri }), // from expo-auth-session
 *     apple:  async () => ({ idToken, nonce }),                   // from expo-apple-authentication
 *   },
 * });
 * const session = await social.login("google");
 * ```
 */
export interface SocialClientConfig {
  http: SocialHttp;
  /** Persists the session token on success. May be async. */
  setToken: (token: string) => void | Promise<void>;
  /** One authorizer per provider the app offers. A provider with no authorizer can't be used. */
  authorizers: Partial<Record<SocialProvider, SocialAuthorizer>>;
}

export function createSocialClient(config: SocialClientConfig): SocialClient {
  const { http, setToken, authorizers } = config;
  return {
    async login(provider) {
      const authorize = authorizers[provider];
      if (!authorize) {
        throw new TcError("social_provider_unconfigured", `no authorizer configured for "${provider}"`);
      }
      const credential = await authorize();
      const session = await http.post<Session>(SOCIAL_ROUTE, { provider, ...credential });
      await setToken(session.token);
      return session;
    },
  };
}

export type { SocialAuthorizer, SocialClient, SocialCredential, SocialProvider, SocialLoginInput, Session } from "./port";
