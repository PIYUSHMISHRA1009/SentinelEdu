# GCP Cloud SQL Module
# Creates a production-grade Cloud SQL PostgreSQL instance with encryption, backup, and monitoring

# ============================================================
# VARIABLES
# ============================================================
variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "instance_name" {
  description = "Cloud SQL instance name"
  type        = string
  default     = "insightflow"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "database_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "tier" {
  description = "Machine tier"
  type        = string
  default     = "db-custom-4-16384"
}

variable "disk_size_gb" {
  description = "Disk size in GB"
  type        = number
  default     = 100
}

variable "disk_type" {
  description = "Disk type (PD_SSD or PD_HDD)"
  type        = string
  default     = "PD_SSD"
}

variable "disk_autoresize" {
  description = "Enable disk autoresize"
  type        = bool
  default     = true
}

variable "storage_encrypted" {
  description = "Enable storage encryption"
  type        = bool
  default     = true
}

variable "kms_key_name" {
  description = "KMS key name for encryption"
  type        = string
  default     = ""
}

variable "backup_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_start_time" {
  description = "Backup start time (HH:MM)"
  type        = string
  default     = "03:00"
}

variable "backup_retention_days" {
  description = "Backup retention in days"
  type        = number
  default     = 30
}

variable "maintenance_window_day" {
  description = "Maintenance window day"
  type        = string
  default     = "SUN"
}

variable "maintenance_window_hour" {
  description = "Maintenance window hour"
  type        = number
  default     = 4
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "high_availability" {
  description = "Enable high availability"
  type        = bool
  default     = true
}

variable "database_name" {
  description = "Default database name"
  type        = string
  default     = "insightflow"
}

variable "username" {
  description = "PostgreSQL username"
  type        = string
  default     = "insightflow"
}

variable "password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "authorized_networks" {
  description = "List of authorized networks"
  type        = list(object({ name = string, value = string }))
  default     = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# ============================================================
# RESOURCES
# ============================================================

# Cloud SQL Instance
resource "google_sql_database_instance" "main" {
  name             = "${var.environment}-${var.instance_name}"
  project          = var.project_id
  region           = var.region
  database_version = var.database_version
  deletion_protection = var.deletion_protection

  settings {
    tier                    = var.tier
    disk_size               = var.disk_size_gb
    disk_type               = var.disk_type
    disk_autoresize         = var.disk_autoresize
    storage_auto_resize     = var.disk_autoresize
    storage_auto_resize_limit = 0

    # Encryption
    encryption_configuration {
      kms_key_name = var.kms_key_name != "" ? var.kms_key_name : null
    }

    # Backup
    backup_configuration {
      enabled                       = var.backup_enabled
      start_time                    = var.backup_start_time
      transaction_log_retention_days = var.backup_retention_days
      point_in_time_recovery_enabled = true
    }

    # Maintenance
    maintenance_window {
      day  = var.maintenance_window_day
      hour = var.maintenance_window_hour
    }

    # High Availability
    availability_type = var.high_availability ? "REGIONAL" : "ZONAL"

    # Database flags
    database_flags {
      name  = "log_statement"
      value = "all"
    }
    database_flags {
      name  = "log_min_duration_statement"
      value = "1000"
    }
    database_flags {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements,auto_explain"
    }
    database_flags {
      name  = "auto_explain.log_min_duration"
      value = "1000"
    }
    database_flags {
      name  = "auto_explain.log_analyze"
      value = "true"
    }
    database_flags {
      name  = "track_activity_query_size"
      value = "2048"
    }
    database_flags {
      name  = "max_connections"
      value = "500"
    }

    # Authorized networks
    dynamic "ip_configuration" {
      for_each = length(var.authorized_networks) > 0 ? [1] : []
      content {
        authorized_networks = var.authorized_networks
        ipv4_enabled        = true
        require_ssl         = true
      }
    }

    # Insights
    insights_config {
      query_insights_enabled = true
      query_string_length    = 1024
      query_plans_per_minute = 100
    }

    # Pricing plan
    pricing_plan = "PER_USE"

    # Labels
    labels = merge(var.tags, {
      environment = var.environment
    })
  }
}

# Default Database
resource "google_sql_database" "default" {
  name     = var.database_name
  instance = google_sql_database_instance.main.name
  project  = var.project_id
  charset  = "UTF8"
  collation = "en_US.UTF8"
}

# Database User
resource "google_sql_user" "default" {
  name     = var.username
  instance = google_sql_database_instance.main.name
  project  = var.project_id
  password = var.password
}

# Read Replica (for staging/prod)
resource "google_sql_database_instance" "replica" {
  count = var.environment != "dev" ? 1 : 0

  name             = "${var.environment}-${var.instance_name}-replica"
  project          = var.project_id
  region           = var.region
  database_version = var.database_version
  master_instance_name = google_sql_database_instance.main.name

  settings {
    tier               = var.tier
    disk_size          = var.disk_size_gb
    disk_type          = var.disk_type
    disk_autoresize    = var.disk_autoresize
    availability_type  = "ZONAL"

    database_flags {
      name  = "log_statement"
      value = "all"
    }
    database_flags {
      name  = "log_min_duration_statement"
      value = "1000"
    }

    labels = merge(var.tags, {
      environment = var.environment
      role        = "replica"
    })
  }

  replica_configuration {
    kind = "SYNCHRONOUS"
  }
}

# Cloud SQL Connectors (Private Service Connect)
resource "google_compute_network" "peering" {
  count = 1 # Created once per environment
  name        = "${var.environment}-vpc-peering"
  project     = var.project_id
  description = "VPC peering for Cloud SQL"
}

resource "google_service_networking_connection" "private_ip" {
  project             = var.project_id
  network             = google_compute_network.peering[0].name
  reserved_peering_ranges = ["${var.environment}-sql-peering"]
  depends_on = [google_compute_network.peering]
}

# Monitoring
resource "google_monitoring_alert_policy" "cpu_high" {
  display_name = "${var.environment}-${var.instance_name}-cpu-high"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "CPU utilization high"
    condition_threshold {
      filter     = "metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\" AND resource.type=\"cloudsql_database\" AND resource.label.database_id=\"${google_sql_database_instance.main.name}\""
      duration   = "300s"
      comparison = "COMPARISON_GT"
      threshold_value = 0.8
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]
}

resource "google_monitoring_alert_policy" "storage_low" {
  display_name = "${var.environment}-${var.instance_name}-storage-low"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Disk space low"
    condition_threshold {
      filter     = "metric.type=\"cloudsql.googleapis.com/database/disk/bytes_used\" AND resource.type=\"cloudsql_database\" AND resource.label.database_id=\"${google_sql_database_instance.main.name}\""
      duration   = "300s"
      comparison = "COMPARISON_GT"
      threshold_value = 0.85
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]
}

resource "google_monitoring_notification_channel" "email" {
  display_name = "${var.environment}-cloudsql-alerts"
  type         = "email"
  labels = {
    email_address = "alerts@insightflow.edu"
  }
  project = var.project_id
}

# ============================================================
# OUTPUTS
# ============================================================

output "instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.main.name
}

output "instance_connection_name" {
  description = "Connection name for Cloud SQL Proxy"
  value       = google_sql_database_instance.main.connection_name
}

output "instance_ip" {
  description = "Private IP address"
  value       = google_sql_database_instance.main.private_ip_address
}

output "instance_public_ip" {
  description = "Public IP address"
  value       = google_sql_database_instance.main.public_ip_address
}

output "instance_self_link" {
  description = "Instance self link"
  value       = google_sql_database_instance.main.self_link
}

output "database_name" {
  description = "Default database name"
  value       = var.database_name
}

output "database_user" {
  description = "Database username"
  value       = var.username
}

output "replica_connection_name" {
  description = "Replica connection name"
  value       = var.environment != "dev" ? google_sql_database_instance.replica[0].connection_name : null
}