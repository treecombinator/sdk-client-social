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

`createSocialClient({ http, setToken, authorizers })` → `login(provider)`. Also exports
`Session`, `SocialProvider`, `SocialLoginInput`, `SocialAuthorizer`, `SocialCredential`, `SocialClient`.

## Notes

- The auth wire shapes (`Session`, `SocialProvider`, `SocialLoginInput`) and the BFF social route are declared LOCALLY — this package consumes them, it does not share a contract package.
- `http` (an object with `post<T>(path, body)`) and `setToken(token)` are injected via inline shapes — no dependency on any transport or auth package.
- Errors are `TcError` (from `@treecombinator/sdk-common`) with a specific code: `social_provider_unconfigured`.
- Authorizers are injected, so this package never depends on expo-auth-session / expo-apple-authentication.
