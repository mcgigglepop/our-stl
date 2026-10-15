########################################
# Lambda package
########################################

data "archive_file" "api" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-src"
  output_path = "${path.module}/lambda-api.zip"
}

########################################
# Lambda IAM role + scoped policy
########################################

resource "aws_iam_role" "api" {
  name = "${var.app_name}-api-lambda"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = var.tags
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${var.app_name}-api"
  retention_in_days = 14
  tags              = var.tags
}

data "aws_iam_policy_document" "api" {
  statement {
    sid     = "CloudWatchLogs"
    effect  = "Allow"
    actions = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = [
      "${aws_cloudwatch_log_group.api.arn}:*",
    ]
  }

  statement {
    sid    = "ReportsBucket"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:PutObjectTagging",
      "s3:GetObjectTagging",
      "s3:DeleteObject",
      "s3:DeleteObjectTagging",
    ]
    resources = ["${aws_s3_bucket.reports.arn}/*"]
  }

  statement {
    sid       = "RekognitionModeration"
    effect    = "Allow"
    actions   = ["rekognition:DetectModerationLabels"]
    resources = ["*"]
  }

  statement {
    sid     = "BedrockInvoke"
    effect  = "Allow"
    actions = ["bedrock:InvokeModel"]
    # Modern Claude model IDs on Bedrock can be either foundation-model ARNs
    # or inference-profile ARNs; wildcard both to avoid ARN-shape mismatches.
    resources = [
      "arn:aws:bedrock:*::foundation-model/anthropic.*",
      "arn:aws:bedrock:*:*:inference-profile/*",
    ]
  }

  statement {
    sid       = "LocationGeocode"
    effect    = "Allow"
    actions   = ["geo:SearchPlaceIndexForPosition"]
    resources = [aws_location_place_index.main.index_arn]
  }

  statement {
    sid    = "DynamoDBReports"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:GetItem",
      "dynamodb:DeleteItem",
    ]
    resources = [
      aws_dynamodb_table.reports.arn,
      "${aws_dynamodb_table.reports.arn}/index/*",
    ]
  }

  statement {
    sid    = "DynamoDBAbusePrevention"
    effect = "Allow"
    actions = [
      "dynamodb:UpdateItem",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
    ]
    resources = [
      aws_dynamodb_table.rate_limits.arn,
      aws_dynamodb_table.image_hashes.arn,
    ]
  }
}

resource "aws_iam_role_policy" "api" {
  name   = "${var.app_name}-api-policy"
  role   = aws_iam_role.api.id
  policy = data.aws_iam_policy_document.api.json
}

########################################
# Lambda function
########################################

resource "aws_lambda_function" "api" {
  function_name    = "${var.app_name}-api"
  role             = aws_iam_role.api.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      REPORTS_BUCKET      = aws_s3_bucket.reports.bucket
      REPORTS_TABLE       = aws_dynamodb_table.reports.name
      RATE_LIMITS_TABLE   = aws_dynamodb_table.rate_limits.name
      IMAGE_HASHES_TABLE  = aws_dynamodb_table.image_hashes.name
      PLACE_INDEX_NAME    = aws_location_place_index.main.index_name
      BEDROCK_MODEL_ID    = var.bedrock_model_id
      RATE_LIMIT_PER_HOUR = "5"
      RATE_LIMIT_PER_DAY  = "20"
    }
  }

  depends_on = [
    aws_iam_role_policy.api,
    aws_cloudwatch_log_group.api,
  ]

  tags = var.tags
}
