output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.mobile.id
}

output "cognito_domain" {
  description = "Cognito User Pool Domain"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "aws_region" {
  description = "AWS region"
  value       = data.aws_region.current.name
}

output "user_pool_endpoint" {
  description = "Cognito User Pool endpoint"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "api_base_url" {
  description = "Base URL for the OurSTL API"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "reports_bucket" {
  description = "S3 bucket name for civic report uploads"
  value       = aws_s3_bucket.reports.bucket
}

output "reports_table" {
  description = "DynamoDB table name for civic reports"
  value       = aws_dynamodb_table.reports.name
}

output "env_config" {
  description = "Environment variables for the mobile app"
  value = {
    COGNITO_USER_POOL_ID = aws_cognito_user_pool.main.id
    COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.mobile.id
    AWS_REGION           = data.aws_region.current.name
    API_BASE_URL         = aws_apigatewayv2_api.main.api_endpoint
  }
  sensitive = false
}
