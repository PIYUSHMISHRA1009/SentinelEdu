# AWS S3 Module
# Creates S3 buckets for artifacts, frontend assets, and backups with encryption and lifecycle policies

# ============================================================
# VARIABLES
# ============================================================
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "bucket_suffix" {
  description = "Suffix to append to bucket names for uniqueness"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "enable_versioning" {
  description = "Enable S3 versioning"
  type        = bool
  default     = true
}

variable "enable_server_side_encryption" {
  description = "Enable SSE-S3 encryption"
  type        = bool
  default     = true
}

variable "enable_access_logging" {
  description = "Enable access logging"
  type        = bool
  default     = true
}

variable "access_log_bucket" {
  description = "Bucket for access logs"
  type        = string
  default     = ""
}

# ============================================================
# RESOURCES
# ============================================================

# Artifacts Bucket (for CI/CD artifacts, ML models, etc.)
resource "aws_s3_bucket" "artifacts" {
  bucket = "insightflow-${var.environment}-artifacts${var.bucket_suffix}"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = var.enable_server_side_encryption ? "AES256" : "AES256"
      }
    }
  }

  versioning {
    enabled = var.enable_versioning
  }

  lifecycle_rule {
    id      = "expire-old-versions"
    enabled = true
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  lifecycle_rule {
    id      = "expire-incomplete-multipart-uploads"
    enabled = true
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-artifacts"
    Environment = var.environment
    Purpose     = "ci-cd-artifacts"
  })
}

# Access logging for artifacts bucket
resource "aws_s3_bucket_logging" "artifacts" {
  count = var.enable_access_logging && var.access_log_bucket != "" ? 1 : 0
  bucket = aws_s3_bucket.artifacts.id
  target_bucket = var.access_log_bucket
  target_prefix = "artifacts/"
}

# Public access block for artifacts
resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Frontend Assets Bucket (for static assets)
resource "aws_s3_bucket" "frontend_assets" {
  bucket = "insightflow-${var.environment}-frontend-assets${var.bucket_suffix}"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = var.enable_server_side_encryption ? "AES256" : "AES256"
      }
    }
  }

  versioning {
    enabled = var.enable_versioning
  }

  # Static website hosting (optional, if not using CloudFront)
  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age         = 3600
  }

  lifecycle_rule {
    id      = "expire-old-versions"
    enabled = true
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-frontend-assets"
    Environment = var.environment
    Purpose     = "frontend-static-assets"
  })
}

# Access logging for frontend assets
resource "aws_s3_bucket_logging" "frontend_assets" {
  count = var.enable_access_logging && var.access_log_bucket != "" ? 1 : 0
  bucket = aws_s3_bucket.frontend_assets.id
  target_bucket = var.access_log_bucket
  target_prefix = "frontend-assets/"
}

# Public access block for frontend assets
resource "aws_s3_bucket_public_access_block" "frontend_assets" {
  bucket = aws_s3_bucket.frontend_assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Backups Bucket (for database backups, etc.)
resource "aws_s3_bucket" "backups" {
  bucket = "insightflow-${var.environment}-backups${var.bucket_suffix}"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = var.enable_server_side_encryption ? "AES256" : "AES256"
      }
    }
  }

  versioning {
    enabled = var.enable_versioning
  }

  lifecycle_rule {
    id      = "transition-to-ia"
    enabled = true
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }

  lifecycle_rule {
    id      = "transition-to-glacier"
    enabled = true
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }

  lifecycle_rule {
    id      = "expire-old-backups"
    enabled = true
    expiration {
      days = 365
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-backups"
    Environment = var.environment
    Purpose     = "database-backups"
  })
}

# Access logging for backups
resource "aws_s3_bucket_logging" "backups" {
  count = var.enable_access_logging && var.access_log_bucket != "" ? 1 : 0
  bucket = aws_s3_bucket.backups.id
  target_bucket = var.access_log_bucket
  target_prefix = "backups/"
}

# Public access block for backups
resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Access Logs Bucket (created separately to avoid circular dependency)
resource "aws_s3_bucket" "access_logs" {
  bucket = "insightflow-${var.environment}-access-logs${var.bucket_suffix}"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = var.enable_server_side_encryption ? "AES256" : "AES256"
      }
    }
  }

  lifecycle_rule {
    id      = "expire-access-logs"
    enabled = true
    expiration {
      days = 90
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-access-logs"
    Environment = var.environment
    Purpose     = "s3-access-logs"
  })
}

# Public access block for access logs
resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================
# BUCKET POLICIES
# ============================================================

# Allow CloudFront to read frontend assets (if using CloudFront)
resource "aws_s3_bucket_policy" "frontend_assets" {
  bucket = aws_s3_bucket.frontend_assets.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontRead"
        Effect = "Allow"
        Principal = {
          CanonicalUser = var.cloudfront_oai_id != "" ? var.cloudfront_oai_id : ""
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend_assets.arn}/*"
        Condition = {
          StringEquals = {
            "aws:Referer" = "https://insightflow.edu"
          }
        }
      }
    ]
  })
}

# ============================================================
# OUTPUTS
# ============================================================

output "artifacts_bucket_name" {
  description = "Artifacts bucket name"
  value       = aws_s3_bucket.artifacts.id
}

output "artifacts_bucket_arn" {
  description = "Artifacts bucket ARN"
  value       = aws_s3_bucket.artifacts.arn
}

output "frontend_assets_bucket_name" {
  description = "Frontend assets bucket name"
  value       = aws_s3_bucket.frontend_assets.id
}

output "frontend_assets_bucket_arn" {
  description = "Frontend assets bucket ARN"
  value       = aws_s3_bucket.frontend_assets.arn
}

output "backups_bucket_name" {
  description = "Backups bucket name"
  value       = aws_s3_bucket.backups.id
}

output "backups_bucket_arn" {
  description = "Backups bucket ARN"
  value       = aws_s3_bucket.backups.arn
}

output "access_logs_bucket_name" {
  description = "Access logs bucket name"
  value       = aws_s3_bucket.access_logs.id
}

output "access_logs_bucket_arn" {
  description = "Access logs bucket ARN"
  value       = aws_s3_bucket.access_logs.arn
}