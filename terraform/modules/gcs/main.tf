# GCP GCS Module
# Creates Cloud Storage buckets for artifacts, frontend assets, and backups with encryption and lifecycle policies

# ============================================================
# VARIABLES
# ============================================================
variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "bucket_suffix" {
  description = "Suffix to append to bucket names for uniqueness"
  type        = string
  default     = ""
}

variable "location" {
  description = "Bucket location (region or multi-region)"
  type        = string
  default     = "US"
}

variable "tags" {
  description = "Labels to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "enable_versioning" {
  description = "Enable GCS versioning"
  type        = bool
  default     = true
}

variable "enable_uniform_bucket_level_access" {
  description = "Enable uniform bucket-level access"
  type        = bool
  default     = true
}

# ============================================================
# RESOURCES
# ============================================================

# Artifacts Bucket (for CI/CD artifacts, ML models, etc.)
resource "google_storage_bucket" "artifacts" {
  name          = "insightflow-${var.environment}-artifacts${var.bucket_suffix}"
  project       = var.project_id
  location      = var.location
  storage_class = "STANDARD"
  force_destroy = false

  versioning {
    enabled = var.enable_versioning
  }

  uniform_bucket_level_access = var.enable_uniform_bucket_level_access

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age                     = 30
      is_live                 = false
      matches_storage_class   = ["STANDARD", "NEARLINE", "COLDLINE", "ARCHIVE"]
    }
  }

  lifecycle_rule {
    action {
      type = "AbortIncompleteMultipartUpload"
    }
    condition {
      age = 7
    }
  }

  labels = merge(var.tags, {
    environment = var.environment
    purpose     = "ci-cd-artifacts"
  })
}

# Frontend Assets Bucket (for static assets)
resource "google_storage_bucket" "frontend_assets" {
  name          = "insightflow-${var.environment}-frontend-assets${var.bucket_suffix}"
  project       = var.project_id
  location      = var.location
  storage_class = "STANDARD"
  force_destroy = false

  versioning {
    enabled = var.enable_versioning
  }

  uniform_bucket_level_access = var.enable_uniform_bucket_level_access

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type", "ETag"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age                     = 30
      is_live                 = false
    }
  }

  labels = merge(var.tags, {
    environment = var.environment
    purpose     = "frontend-static-assets"
  })
}

# Backups Bucket (for database backups, etc.)
resource "google_storage_bucket" "backups" {
  name          = "insightflow-${var.environment}-backups${var.bucket_suffix}"
  project       = var.project_id
  location      = var.location
  storage_class = "STANDARD"
  force_destroy = false

  versioning {
    enabled = var.enable_versioning
  }

  uniform_bucket_level_access = var.enable_uniform_bucket_level_access

  lifecycle_rule {
    action {
      type = "SetStorageClass"
      storage_class = "NEARLINE"
    }
    condition {
      age = 30
      matches_storage_class = ["STANDARD"]
    }
  }

  lifecycle_rule {
    action {
      type = "SetStorageClass"
      storage_class = "COLDLINE"
    }
    condition {
      age = 90
      matches_storage_class = ["STANDARD", "NEARLINE"]
    }
  }

  lifecycle_rule {
    action {
      type = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
    condition {
      age = 365
      matches_storage_class = ["STANDARD", "NEARLINE", "COLDLINE"]
    }
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 1095  # 3 years
      matches_storage_class = ["STANDARD", "NEARLINE", "COLDLINE", "ARCHIVE"]
    }
  }

  labels = merge(var.tags, {
    environment = var.environment
    purpose     = "database-backups"
  })
}

# Access Logs Bucket
resource "google_storage_bucket" "access_logs" {
  name          = "insightflow-${var.environment}-access-logs${var.bucket_suffix}"
  project       = var.project_id
  location      = var.location
  storage_class = "STANDARD"
  force_destroy = false

  versioning {
    enabled = var.enable_versioning
  }

  uniform_bucket_level_access = var.enable_uniform_bucket_level_access

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 90
    }
  }

  labels = merge(var.tags, {
    environment = var.environment
    purpose     = "gcs-access-logs"
  })
}

# ============================================================
# BUCKET IAM POLICIES
# ============================================================

# Allow Cloud CDN to read frontend assets
resource "google_storage_bucket_iam_binding" "frontend_assets_cdn" {
  bucket = google_storage_bucket.frontend_assets.name
  role   = "roles/storage.objectViewer"
  members = [
    "allUsers"  # For public read access (if needed)
  ]
}

# Allow backend service account to read/write artifacts
resource "google_storage_bucket_iam_binding" "artifacts_backend" {
  bucket = google_storage_bucket.artifacts.name
  role   = "roles/storage.objectAdmin"
  members = [
    "serviceAccount:insightflow-${var.environment}@${var.project_id}.iam.gserviceaccount.com"
  ]
}

# Allow backend service account to read/write backups
resource "google_storage_bucket_iam_binding" "backups_backend" {
  bucket = google_storage_bucket.backups.name
  role   = "roles/storage.objectAdmin"
  members = [
    "serviceAccount:insightflow-${var.environment}@${var.project_id}.iam.gserviceaccount.com"
  ]
}

# ============================================================
# OUTPUTS
# ============================================================

output "artifacts_bucket_name" {
  description = "Artifacts bucket name"
  value       = google_storage_bucket.artifacts.name
}

output "artifacts_bucket_self_link" {
  description = "Artifacts bucket self link"
  value       = google_storage_bucket.artifacts.self_link
}

output "frontend_assets_bucket_name" {
  description = "Frontend assets bucket name"
  value       = google_storage_bucket.frontend_assets.name
}

output "frontend_assets_bucket_self_link" {
  description = "Frontend assets bucket self link"
  value       = google_storage_bucket.frontend_assets.self_link
}

output "backups_bucket_name" {
  description = "Backups bucket name"
  value       = google_storage_bucket.backups.name
}

output "backups_bucket_self_link" {
  description = "Backups bucket self link"
  value       = google_storage_bucket.backups.self_link
}

output "access_logs_bucket_name" {
  description = "Access logs bucket name"
  value       = google_storage_bucket.access_logs.name
}

output "access_logs_bucket_self_link" {
  description = "Access logs bucket self link"
  value       = google_storage_bucket.access_logs.self_link
}