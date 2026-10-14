# OurSTL Implementation Plan

Cross-stack development roadmap for the OurSTL hackathon build.

---

## Stage 1: Auth + Shell Vertical Slice

**Goal**: Deploy Cognito infrastructure and ship a running shell app whose look matches the OurSTL website: branded header, four-tab bottom nav (empty), and a working sign up / confirm / sign in / sign out flow.

**Success Criteria**:
- `terraform validate` + `terraform fmt -check` pass on `infra/`.
- `npx tsc --noEmit`, `npm test`, and `npx expo-doctor` all clean in `app/`.
- Auth flow: user can sign up → receive code → confirm → sign in → see tabs → sign out → return to login.
- Four-tab bottom nav (`Community Feed`, `Civic Reporting`, `Rehab Help`, `Food & Shelter`) renders in the exact order and labels of the website, each routing to an empty placeholder.
- Brand header renders the OurSTL wordmark + tagline + "Community-powered" pill + avatar; avatar tap triggers sign out.
- Tokens persisted in `expo-secure-store`; session survives app restart.

**Tests**:
- `authReducer` unit tests: loading, error, user+token writes, sign-out reset, partial user merges.

**Files**:
- `infra/main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`
- `app/src/app/_layout.tsx`, `index.tsx`, `(auth)/*`, `(tabs)/*`
- `app/src/auth/CognitoContext.tsx`, `authReducer.ts`
- `app/src/components/Brand.tsx`, `Header.tsx`, `EmptyScreen.tsx`
- `app/src/theme/index.ts`
- `app/.env.example`

**Status**: **COMPLETE** ✓

---

## Stage 2: Community Feed tab

**Goal**: Build the Community Feed tab — hero, filter chips, post cards, "new post" modal — matching the website's `#feed` section.

**Success Criteria**:
- Hero gradient card renders the eyebrow + headline + body copy.
- Filter chip row (`All posts`, `Civic issues`, `Good news`, `Community events`) filters local post state.
- Post cards show author avatar/name, timestamp, title, body, status pill, action row (Confirm / Comment / Follow).
- "New post" button opens a modal that prepends a post locally (no backend yet).

**Tests**:
- Filter chip reducer test.
- Snapshot test for a post card (once jest-expo RN runtime is wired).

**Status**: Not Started

---

## Stage 3: Password Management & Account Settings

**Goal**: Implement change password, password reset, and account settings screens.

**Success Criteria**:
- User can change password from settings
- User can initiate password reset flow
- Password reset code verified and new password set
- Settings screen displays user profile data
- Update user attributes (name, phone, etc.)
- Account deletion with confirmation

**Tests**:
- Change password flow unit test
- Reset password flow unit test
- Settings screen rendering test

**Dependencies**:
- CognitoContext already has methods implemented

**Status**: Not Started

---

## Stage 4: Advanced Auth & Security

**Goal**: Add MFA, biometric auth, and security-hardening features.

**Success Criteria**:
- Optional TOTP-based MFA setup in settings
- Face ID / Touch ID authentication support
- Session timeout with re-authentication
- Device trust / remember this device
- Logout from all devices
- Security event notifications

**Tests**:
- MFA enrollment flow test
- Biometric auth fallback test
- Session timeout test

**Dependencies**:
- `expo-local-authentication` (biometric)
- `speakeasy` or `otplib` (TOTP generation)

**Status**: Not Started

---

## Stage 5: API Integration & Backend

**Goal**: Connect app to backend API with auth token injection and error handling.

**Success Criteria**:
- API client configured with Cognito auth header
- Protected endpoints authenticated with access token
- Automatic token refresh on 401 responses
- Error handling for API failures
- Request/response logging
- Network error recovery

**Tests**:
- API client unit tests with mock responses
- Auth header injection test
- Token refresh flow test

**Dependencies**:
- `axios` or `fetch` API client
- `react-query` or `SWR` for caching

**Status**: Not Started

---

## Stage 6: Analytics & Monitoring

**Goal**: Add error tracking, analytics, and performance monitoring.

**Success Criteria**:
- Error reporting configured (Sentry, Rollbar)
- Analytics events tracked (signup, login, errors)
- Performance metrics captured (auth latency, API response times)
- Crash reporting enabled
- User journey tracking

**Tests**:
- Analytics event dispatch test
- Error reporting mock test

**Dependencies**:
- `sentry-react-native`
- `@react-native-firebase/analytics` or third-party

**Status**: Not Started

---

## Development Workflow

### Before Each Commit

```bash
# 1. Run tests
npm test -- --watchAll=false

# 2. Type check
npm run typecheck

# 3. Lint
npm run lint

# 4. Format
npm run format

# 5. Visual testing (if UI changes)
npm run start
```

### Deployment Steps

1. **Infrastructure First** — Deploy Terraform to create Cognito
2. **Environment Setup** — Create `.env.local` from terraform outputs
3. **Development Testing** — Test on simulator/device
4. **Production Build** — Create release build via EAS
5. **Validation** — Verify auth flow end-to-end
6. **Release** — Submit to App Store / Google Play

### Branching Strategy

```
main                    # Production releases
├── develop             # Staging / pre-release
│   ├── feature/auth    # Stage 1 work
│   ├── feature/nav     # Stage 2 work
│   └── bugfix/*        # Hot fixes
```

---

## Key Decisions & Rationale

### Why SRP (Secure Remote Password)?

- **No Plaintext Transmission** — Password never sent to server over network
- **Resilient to Network Sniffing** — Even if intercepted, password unrecoverable
- **Industry Standard** — Used by Apple, AWS, Dropbox, etc.
- **Cognito Native** — Supported out-of-the-box, no extra config

### Why Expo Managed Workflow?

- **No Native Code** — Avoids Xcode/Android Studio setup complexity
- **Fast Iteration** — Hot reload and instant preview
- **EAS Build** — Cloud builds eliminate CI/CD infrastructure
- **Over-the-Air Updates** — Deploy fixes without app store review

### Why TypeScript?

- **Type Safety** — Catch errors at compile time
- **Better IDE Support** — Autocomplete and refactoring
- **Self-Documenting** — Types serve as inline documentation
- **Scalability** — Easier refactoring as codebase grows

---

## Testing Strategy

### Test Pyramid
```
        /\
       /  \ Unit Tests (70%)
      /    \
     /______\
    /        \
   / Int'n    \ Integration Tests (20%)
  /  Tests    \
 /____________\
/              \
/  E2E Tests    \ E2E Tests (10%)
\              /
 \____________/
```

### Test Coverage Goals

- **Auth Context** — 80%+ coverage
- **Screens** — 60%+ coverage (focus on UX, not implementation details)
- **Utilities** — 90%+ coverage
- **Overall** — 65%+ coverage minimum

### Testing Tools

- **Jest** — Test runner
- **React Native Testing Library** — Component testing
- **Mock Cognito SDK** — Avoid AWS calls in tests

---

## Known Limitations & Workarounds

### Limitation: No Local Simulator Testing in CI

**Why**: This development environment lacks iOS/Android simulators.

**Workaround**: Use EAS Build for cloud testing; validate locally when simulators available.

### Limitation: Web Testing

**Why**: React Native web has platform differences.

**Workaround**: Use Expo web for quick feedback; test iOS/Android with actual devices for production.

### Limitation: Biometric Auth (Stage 4)

**Why**: Requires native code / Expo development build.

**Workaround**: Plan Expo development build setup before Stage 4.

---

## Rollback Plan

If major issues discovered:

1. **Pause Deployment** — Stop app store release
2. **Revert Changes** — Git reset to last stable commit
3. **Root Cause Analysis** — Investigate in isolated environment
4. **Create Hotfix** — Fix on `hotfix/` branch from main
5. **Re-test** — Full test suite before re-release

---

## Success Metrics

By Stage 1 Complete:
- Zero errors on auth screens
- 100% test pass rate
- User can complete full signup → confirm → login → logout flow

By Stage 2 Complete:
- App navigation smooth and responsive
- Design pixel-perfect match to website
- No app crashes or console errors

By Stage 3 Complete:
- Settings fully functional
- Password change/reset works
- All account mutations persisted in Cognito

By Stage 4 Complete:
- MFA enrollment and authentication working
- Biometric auth optional for users
- Security audit passed

By Stage 5 Complete:
- API fully integrated and authenticated
- Network errors handled gracefully
- Performance meets 2-second API response targets

By Stage 6 Complete:
- Error tracking 99% capture rate
- User journey fully instrumented
- Actionable analytics available

---

## References

- [Expo Docs](https://docs.expo.dev)
- [AWS Cognito Docs](https://docs.aws.amazon.com/cognito/)
- [React Native Best Practices](https://reactnative.dev/docs/getting-started)
- [SRP Specification](https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol)
- [OAuth 2.0 / OpenID Connect](https://openid.net/connect/)
