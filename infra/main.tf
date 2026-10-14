# Cognito User Pool
# username_attributes = ["email"] makes the email the sign-in identifier
# (sign-up username == email, no separate internal username). This is mutually
# exclusive with alias_attributes and cannot be changed after creation.
resource "aws_cognito_user_pool" "main" {
  name                = var.user_pool_name
  username_attributes = ["email"]

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = var.password_minimum_length
    require_uppercase = true
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  mfa_configuration = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  deletion_protection = "INACTIVE"
  tags                = var.tags

  # Cognito does not allow schema changes after pool creation. The pool
  # already has the standard attributes it needs (email as username per
  # username_attributes, plus the implicit standard set). Let Cognito own
  # the schema from here forward.
  lifecycle {
    ignore_changes = [schema]
  }
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.app_name}-${data.aws_caller_identity.current.account_id}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Cognito User Pool Client - Public (SRP, no secret)
# Note: "mobile" is the local resource label in Terraform; "client_name" variable provides the display name
resource "aws_cognito_user_pool_client" "mobile" {
  user_pool_id                  = aws_cognito_user_pool.main.id
  name                          = var.app_client_name
  generate_secret               = false
  explicit_auth_flows           = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_PASSWORD_AUTH"]
  prevent_user_existence_errors = "ENABLED"
  access_token_validity         = 60
  id_token_validity             = 60
  refresh_token_validity        = 1209600

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "minutes"
  }

  depends_on = [aws_cognito_user_pool.main]
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
