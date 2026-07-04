# @treecombinator/sdk-client-social

---

> Developed by Danthur Lice.\
> Copyright © 2026 Tree Combinator.\
> Contact: dev (at) treecombinator.com

---

The **social-login** domain of the Tree Combinator SDK client (React Native / Expo + browser) — run a provider's device-side flow, exchange the resulting credential for a session at the BFF (which verifies it), and persist the session token. The app injects one authorizer per provider it offers; the http client and the token setter are injected too, so this package depends only on `@treecombinator/sdk-common` for the error type and couples to no transport or auth package.

## Install

```bash
npm install github:treecombinator/sdk-client-social
```

## Use

```ts
import { createSocialClient } from "@treecombinator/sdk-client-social";

const social = createSocialClient({
  http,                                    // anything with post<T>(path, body)
  setToken: (token) => store.set(token),   // persist where the rest of the SDK reads it
  authorizers: {
    google: async () => ({ code, codeVerifier, redirectUri }), // from expo-auth-session
    apple:  async () => ({ idToken, nonce }),                   // from expo-apple-authentication
  },
});

const session = await social.login("google"); // { token, userId, expiresAt }
```

`createSocialClient(config)` returns the social-login API:

- `login<T extends { token: string } = Session>(provider)` — run the provider's authorizer, POST the credential to the BFF's route for that provider, persist the returned session token, and return the session. Generic at the call site for BFFs that return something richer (e.g. `{ token, user }`); whatever the shape, a response without a top-level string `token` throws.

Config: `{ http, setToken, authorizers, routes? }`.

- `http` — the transport you compose, an object with `post<T>(path, body)`. Injected inline so this package depends on no http package.
- `setToken(token)` — persists the session token (sync or async); wire it to the same store the rest of the SDK reads from.
- `authorizers` — a partial map of `provider → SocialAuthorizer`. An authorizer runs one provider's device-side interaction (e.g. expo-auth-session for Google, expo-apple-authentication for Apple) and returns the credential to forward. A provider with no authorizer can't be used.
- `routes` — per-provider path overrides for BFFs with one route per provider, e.g. `{ google: "/auth/google", apple: "/auth/apple" }`. A provider absent here uses the canonical single route (`/auth/social`, where the `provider` field disambiguates). The `provider` field is still sent either way — a per-provider route can simply ignore it.

The package also exports the auth wire shapes it consumes (`Session`, `SocialProvider`, `SocialLoginInput`), the `SocialAuthorizer` / `SocialCredential` / `SocialClient` types, and the config shapes `SocialClientConfig` / `SocialHttp` (the inline transport interface it accepts).

## Notes

- The credential shape is provider-agnostic: browser/PKCE flows fill `code` (+ `codeVerifier`, `redirectUri`); native flows fill `idToken` (+ `nonce`). The client just forwards whatever the authorizer returns; the BFF verifies it (the client_secret never leaves the server).
- The credential may also carry `name` — a profile hint some providers only reveal on the device: Apple hands the user's name to the client once, on first authorization (the id_token never carries it), so the authorizer forwards it for the BFF to use when creating the account.
- Errors are `TcError` (from `@treecombinator/sdk-common`) with a specific code: `social_provider_unconfigured` when no authorizer is configured for the requested provider; `social_session_invalid` when the BFF response carries no top-level string `token`.
- The auth wire shapes are declared locally — this package is the consumer stating what it expects, so it shares no contract package with the server or auth client.
