variable "aws_region" {
  type        = string
  description = "AWS region for deployment"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Environment name (dev, staging, prod)"
  default     = "dev"
}

variable "app_name" {
  type        = string
  description = "Application name for resource naming"
  default     = "our-stl"
}

variable "user_pool_name" {
  type        = string
  description = "Cognito User Pool name"
  default     = "our-stl-user-pool"
}

variable "app_client_name" {
  type        = string
  description = "Cognito User Pool Client name"
  default     = "our-stl-mobile-client"
}

variable "password_minimum_length" {
  type        = number
  description = "Minimum password length"
  default     = 12
}

variable "tags" {
  type        = map(string)
  description = "Common tags for all resources"
  default = {
    Environment = "dev"
    Project     = "our-stl"
    ManagedBy   = "Terraform"
  }
}

variable "bedrock_model_id" {
  type        = string
  description = "Bedrock model/profile ID for civic report analysis. Must be vision-capable Claude. Claude 4+ models require a cross-region inference profile (us.* / global.*) rather than the raw foundation-model ID. Verify model access is granted in the AWS Bedrock console for your account + region before applying."
  default     = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
}
