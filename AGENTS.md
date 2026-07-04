# AGENTS.md — @treecombinator/sdk-client-social

Social-login domain of the Tree Combinator SDK client (React Native / Expo + browser). Runs a provider's device-side flow, exchanges the credential for a session at the BFF, and persists the token. The app injects the authorizers, the http client, and the token setter.

## Use

```ts
import { createSocialClient } from "@treecombinator/sdk-client-social";

const social = createSocialClient({
  http,                                  // { post<T>(path, body) }
  setToken: (token) => store.set(token), // persist the session token
  authorizers: {
    google: async () => ({ code, codeVerifier, redirectUri }),
    apple:  async () => ({ idToken, nonce }),
  },
});
const session = await social.login("google");
```

`createSocialClient({ http, setToken, authorizers, routes? })` → `login<T extends { token: string } = Session>(provider)`. Also exports
`Session`, `SocialProvider`, `SocialLoginInput`, `SocialAuthorizer`, `SocialCredential`, `SocialClient`,
`SocialClientConfig`, `SocialHttp`.

## Notes

- The auth wire shapes (`Session`, `SocialProvider`, `SocialLoginInput`) and the BFF social route are declared LOCALLY — this package consumes them, it does not share a contract package.
- Canonical route is one `/auth/social` for all providers (the `provider` field disambiguates); `routes: { google: "/auth/google", ... }` overrides the path per provider — `provider` is still sent either way.
- `login` is generic for BFFs returning richer shapes (e.g. `{ token, user }`); a response without a top-level string `token` throws.
- `SocialLoginInput.name` is an optional profile hint the device may forward (Apple reveals the user's name to the client once, on first authorization — never in the id_token) for the BFF to use when creating the account.
- `http` (an object with `post<T>(path, body)`) and `setToken(token)` are injected via inline shapes — no dependency on any transport or auth package.
- Errors are `TcError` (from `@treecombinator/sdk-common`) with a specific code: `social_provider_unconfigured`, `social_session_invalid`.
- Authorizers are injected, so this package never depends on expo-auth-session / expo-apple-authentication.
