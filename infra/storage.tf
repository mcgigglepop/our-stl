########################################
# Reports S3 bucket
########################################

resource "aws_s3_bucket" "reports" {
  bucket        = "${var.app_name}-reports-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = var.tags
}

resource "aws_s3_bucket_ownership_controls" "reports" {
  bucket = aws_s3_bucket.reports.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "reports" {
  bucket                  = aws_s3_bucket.reports.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Allow presigned PUT uploads from the mobile client; mobile uses the host
# device's fetch which sends an Origin header, so CORS has to be permissive.
resource "aws_s3_bucket_cors_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  cors_rule {
    allowed_methods = ["PUT", "GET", "HEAD"]
    allowed_origins = ["*"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# Uploads land in tmp/ and move to reports/ on POST /reports. The lifecycle
# rule reaps anything left in tmp/ after 7 days so abandoned analyze uploads
# don't accumulate.
resource "aws_s3_bucket_lifecycle_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  rule {
    id     = "expire-tmp-uploads"
    status = "Enabled"

    filter {
      prefix = "tmp/"
    }

    expiration {
      days = 7
    }
  }
}

########################################
# Reports DynamoDB table
########################################

resource "aws_dynamodb_table" "reports" {
  name         = "${var.app_name}-reports"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "reportId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "reportId"
    type = "S"
  }

  # Sparse GSI for the community feed: items only appear when they're
  # marked public (publicPartition attribute set), partition keyed by a
  # constant so the whole public feed can be queried in createdAt order.
  attribute {
    name = "publicPartition"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "PublicByCreatedAt"
    hash_key        = "publicPartition"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.tags
}
