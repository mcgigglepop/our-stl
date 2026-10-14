# OurSTL

A cross-platform mobile app for St. Louis civic engagement, built as a hackathon vertical slice. Mirrors the look and feel of the OurSTL website mockup.

## Overview

Stage 1 ships:

- **AWS Cognito authentication** (SRP-based sign in, email-verified sign up) via `amazon-cognito-identity-js` — no Amplify.
- **Expo Router shell** with an `(auth)` group (login / sign up / confirm) and a `(tabs)` group that mirrors the website's four-tab bottom nav.
- **OurSTL design system** — colors, typography, and spacing extracted from the live website HTML (navy / teal / cream).
- **Terraform** provisioning for the Cognito User Pool and public app client.
- **Secure session persistence** via `expo-secure-store`.

Each of the four tabs renders an empty placeholder — later stages will fill them in.

## Technology Stack

### Frontend
- **React Native** — iOS, Android, and web app framework
- **Expo** — Managed workflow for rapid development (SDK v57)
- **TypeScript** — Type-safe development
- **Expo Router** — Built-in file-based routing

### Backend & Auth
- **AWS Cognito** — User authentication and management
- **amazon-cognito-identity-js** — Official Cognito SDK with SRP support
- **expo-secure-store** — Secure token persistence

### Infrastructure
- **Terraform** — Infrastructure as Code for Cognito setup
- **AWS User Pool** — Email-based signup, email verification, strong passwords

## Prerequisites

- **Node.js** >= 18
- **Expo CLI**: `npm install -g expo-cli`
- **AWS Account** with appropriate IAM permissions
- **Terraform** >= 1.0
- **iOS/Android Simulator** or physical device (optional for testing)

## Project Structure

```
our-stl/
├── infra/                           # Terraform infrastructure
│   ├── main.tf                      # Cognito resources
│   ├── variables.tf                 # Input variables
│   ├── outputs.tf                   # Output values
│   ├── versions.tf                  # Provider configuration
│   ├── terraform.tfvars.example     # Example tfvars
│   └── README.md                    # Infrastructure docs
│
├── app/                             # Expo React Native app
│   ├── src/
│   │   ├── app/                    # Expo Router routes
│   │   │   ├── _layout.tsx         # Root layout + CognitoProvider
│   │   │   ├── index.tsx           # Auth-aware redirect
│   │   │   ├── (auth)/             # Login / sign up / confirm
│   │   │   └── (tabs)/             # 4 bottom tabs + shared header
│   │   ├── auth/
│   │   │   ├── CognitoContext.tsx  # Auth provider & hook
│   │   │   ├── authReducer.ts      # Pure reducer (unit-tested)
│   │   │   └── __tests__/          # Reducer tests
│   │   ├── components/
│   │   │   ├── Brand.tsx           # OurSTL wordmark
│   │   │   ├── Header.tsx          # Shared header + sign-out
│   │   │   └── EmptyScreen.tsx     # Placeholder for tabs
│   │   └── theme/
│   │       └── index.ts            # Design tokens from the website
│   ├── .env.example                # Environment template
│   ├── app.json                    # Expo configuration
│   ├── jest.config.js              # Jest config (reducer only)
│   ├── package.json                # Dependencies
│   └── tsconfig.json               # TypeScript config
│
├── IMPLEMENTATION_PLAN.md           # Development stages
└── README.md                        # This file
```

## Getting Started

### 1. Deploy Infrastructure

```bash
cd infra

# Initialize Terraform
terraform init

# Copy and customize variables
cp terraform.tfvars.example terraform.tfvars

# Review and apply
terraform plan
terraform apply

# Save outputs (you'll need these in the next step)
terraform output -json > ../app/.env.local.json
```

After applying, you'll have:
- **User Pool ID** (e.g., `us-east-1_abc123xyz`)
- **Client ID** (e.g., `1a2b3c4d5e6f7g8h9i0j`)
- **AWS Region** (e.g., `us-east-1`)

### 2. Configure App

```bash
cd app

# Copy the environment template
cp .env.example .env.local

# Edit with values from terraform output
# EXPO_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_abc123xyz
# EXPO_PUBLIC_COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
# EXPO_PUBLIC_AWS_REGION=us-east-1
```

### 3. Install Dependencies

```bash
cd app
npm install
```

### 4. Run Locally

#### Start Development Server
```bash
npm run start
```

#### Run on iOS
```bash
npm run ios
```

#### Run on Android
```bash
npm run android
```

#### Run on Web
```bash
npm run web
```

#### Run Tests
```bash
npm test
```

#### Type Check
```bash
npm run typecheck
```

## Authentication Flow

### Sign Up
1. User enters email, password, and name
2. Password is validated (12+ chars, uppercase, lowercase, number, symbol)
3. Account created in Cognito User Pool
4. Verification code sent to email
5. User confirms email with code
6. Account activated

### Sign In
1. User enters email and password
2. SRP authentication with Cognito (secure, no plaintext password transmission)
3. ID token decoded to extract user info
4. Access and refresh tokens stored in `expo-secure-store`
5. User session persisted across app restarts

### Session Persistence
- Tokens stored in encrypted device storage (`expo-secure-store`)
- Automatically loaded on app launch if valid
- Refresh token used to obtain new access tokens when expired
- Sign out clears all stored tokens

## Why `amazon-cognito-identity-js` Instead of Amplify?

While AWS Amplify provides a higher-level API, we chose `amazon-cognito-identity-js` for several reasons:

1. **Explicit Control** — Direct control over authentication flow without framework abstraction
2. **Smaller Bundle** — Amplify adds significant overhead; Cognito SDK is lightweight
3. **Managed Workflow Compatibility** — Works seamlessly with Expo managed workflow without native code
4. **SRP by Default** — Implements Secure Remote Password out of the box for password security
5. **Simpler Setup** — No Amplify CLI or CloudFormation complexity
6. **Production Patterns** — Implements industry-standard OAuth 2.0 / OpenID Connect flows

Amplify is excellent for rapid prototyping and full-stack AWS integration, but for auth-focused mobile apps, the direct SDK is more appropriate.

## Key Features

### Security
- **Secure Remote Password (SRP)** — Never transmits plaintext password
- **Encrypted Token Storage** — Tokens stored in device's secure enclave
- **Email Verification** — Required for account activation
- **Strong Password Policy** — 12+ chars, uppercase, lowercase, numbers, symbols
- **Optional MFA** — Users can enable TOTP after signup

### UI/UX
- **Design Tokens** — Consistent colors, typography, spacing across the app
- **Responsive Layouts** — Optimized for iOS and Android
- **Error Handling** — User-friendly error messages
- **Loading States** — Visual feedback during auth operations
- **Touch Targets** — 44pt minimum touch targets for accessibility

### Developer Experience
- **TypeScript** — Full type safety (`npm run typecheck`)
- **Unit Tests** — Jest against the pure auth reducer
- **Hot Reload** — Fast iteration with Expo
- **Linting** — `npm run lint` (Expo lint)
- **Doctor** — `npx expo-doctor` keeps SDK deps aligned

## Environment Variables

Required variables (from Terraform outputs):

```
EXPO_PUBLIC_COGNITO_USER_POOL_ID    # Cognito User Pool ID
EXPO_PUBLIC_COGNITO_CLIENT_ID       # Cognito App Client ID
EXPO_PUBLIC_AWS_REGION              # AWS region (default: us-east-1)
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Type Check
```bash
npm run typecheck
```

### Lint
```bash
npm run lint
```

Current coverage:
- **`authReducer`** — six unit tests cover loading, errors, user + token writes, sign-out reset, and partial user updates.

Component / integration tests against the Cognito SDK are intentionally deferred — they need a full `jest-expo` setup against RN runtime, which we'll wire in a later stage.

## Building for Production

### iOS Build (using EAS)
```bash
npx eas-cli@latest build --platform ios --profile production
```

### Android Build (using EAS)
```bash
npx eas-cli@latest build --platform android --profile production
```

### Web Build
```bash
npx expo export --platform web
```

See Expo [EAS documentation](https://docs.expo.dev/eas/) for detailed build instructions.

## Deployment Checklist

- [ ] Infrastructure deployed with Terraform
- [ ] Environment variables configured in `.env.local`
- [ ] All tests passing locally (`npm test`)
- [ ] Type checks passing (`npm run typecheck`)
- [ ] Linting passing (`npm run lint`)
- [ ] Development build tested on simulator/device
- [ ] Production build created and tested
- [ ] Error logging configured (Sentry, Rollbar, etc.)
- [ ] Analytics configured (optional)
- [ ] App submitted to App Store / Google Play

## Troubleshooting

### Cognito Configuration Missing
Ensure `.env.local` contains all three required variables from Terraform outputs.

### Sign Up Fails
- Email may already exist — try different email
- Password doesn't meet requirements — use 12+ chars with mixed case, numbers, symbols
- Check AWS Cognito console for detailed error logs

### Tokens Not Persisting
- Verify `expo-secure-store` is working on your device
- Check console for secure storage errors
- Try clearing app data and signing in again

### Type Errors
Run `npm run typecheck` to identify TypeScript issues.

### Tests Failing
- Ensure all dependencies installed: `npm install`
- Check `jest.setup.js` for proper mocks
- Update snapshots if intentional changes made: `npm test -- -u`

## Security Best Practices

1. **Never commit `.env.local`** — Use `.env.example` as template
2. **Rotate credentials regularly** — Use Cognito password reset
3. **Enable MFA** — Encourage users to enable TOTP
4. **Implement rate limiting** — Configure on API backend
5. **Use HTTPS** — Enforce in production
6. **Log suspicious activity** — Monitor Cognito CloudWatch logs
7. **Keep dependencies updated** — Regular npm audit and updates

## Performance Optimization

- **Code Splitting** — Route-based code splitting via Expo Router
- **Image Optimization** — Use Expo Image for responsive images
- **Lazy Loading** — Load screens on-demand
- **Bundle Size** — Monitor with `expo optimize`
- **Caching** — SecureStore caching for tokens

## License

MIT

## Support

For issues or questions:
1. Check [Expo docs](https://docs.expo.dev/)
2. Review [AWS Cognito documentation](https://docs.aws.amazon.com/cognito/)
3. Check [Terraform AWS provider docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
4. Open an issue on the repository

## Next Steps

See `IMPLEMENTATION_PLAN.md` for planned features and development roadmap.
