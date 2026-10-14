# Infrastructure — AWS Cognito via Terraform

## Overview

This Terraform configuration sets up AWS Cognito for authentication in the `our-stl` mobile app.

**What it creates:**

- AWS Cognito User Pool with standard attributes (email, name, phone, etc.)
- User Pool Domain for hosted UI (optional)
- Public User Pool Client configured for SRP (Secure Remote Password) auth, no client secret
- Email verification enabled by default
- Strong password policy (12+ chars, uppercase, lowercase, numbers, symbols)
- Refresh token validity: 30 days
- Access/ID token validity: 60 minutes

## Prerequisites

1. **AWS Account** with appropriate IAM permissions (Cognito, IAM read)
2. **Terraform** >= 1.0 installed
3. **AWS CLI** configured with credentials:
   ```bash
   aws configure
   ```

## Setup & Deployment

### 1. Initialize Terraform

```bash
cd infra
terraform init
```

First run only. Creates `.terraform/` and locks backend if remote state is configured.

### 2. Create terraform.tfvars

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars to override defaults if needed
```

### 3. Validate Configuration

```bash
terraform validate
```

Check syntax and references.

### 4. Plan Deployment

```bash
terraform plan -out=tfplan
```

Review proposed changes.

### 5. Apply

```bash
terraform apply tfplan
```

Creates Cognito User Pool and Client. Outputs credentials.

### 6. Save Outputs

```bash
terraform output -json > ../app/.env.local.json
# Then copy relevant values to app/.env.local
```

## Outputs

After `terraform apply`, run:

```bash
terraform output
```

You'll see:

- `user_pool_id` — ID of your Cognito User Pool
- `user_pool_client_id` — Client ID for the mobile app (Expo React Native)
- `aws_region` — AWS region (default: us-east-1)
- `env_config` — JSON export for app configuration

## Managing State

- **Local state** (default): `.terraform/` and `terraform.tfstate` in this directory
- **Remote state** (optional): Configure in `versions.tf` using S3 or Terraform Cloud
- **.gitignore**: State files are excluded from version control (see root `.gitignore`)

## Updating Configuration

Edit `variables.tf` or `terraform.tfvars`, then:

```bash
terraform plan
terraform apply
```

## Cleanup

To destroy Cognito resources:

```bash
terraform destroy
```

**Warning:** This deletes all users in the User Pool. Ensure you don't need them.

## Troubleshooting

### "Error: User already exists"
Cognito domains are globally unique. If the domain name is taken, adjust `app_name` in `terraform.tfvars`.

### "Invalid access for client"
Ensure the mobile app is using:
- Correct `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID`
- SRP auth flow (not password flow, unless explicitly needed)

### "Terraform state locked"
Check for concurrent applies. If stuck, inspect `.terraform/state.lock.hcl`.

## Security Notes

- **No client secret**: This is intentional for public clients (mobile). The app uses SRP for secure auth without storing a secret.
- **Email verified on signup**: Users must confirm email before login. Verification codes valid for 24 hours.
- **MFA optional**: User can enable TOTP after signup if desired.
- **Strong passwords**: Enforced by policy. Users cannot set weak passwords.

## Next Steps

1. Deploy this Cognito setup
2. Copy outputs to `app/.env.local`
3. Run the React Native app
4. Test signup → email confirm → login flow

For app code, see `../app/README.md`.
