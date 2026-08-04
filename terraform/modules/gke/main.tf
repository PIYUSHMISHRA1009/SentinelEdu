# GCP GKE Module
# Creates a production-grade GKE cluster with node pools

# ============================================================
# VARIABLES
# ============================================================
variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "cluster_name" {
  description = "GKE cluster name"
  type        = string
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

variable "network" {
  description = "VPC network name"
  type        = string
}

variable "subnetwork" {
  description = "Subnetwork name"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "enable_private_nodes" {
  description = "Enable private nodes"
  type        = bool
  default     = true
}

variable "enable_private_endpoint" {
  description = "Enable private cluster endpoint"
  type        = bool
  default     = true
}

variable "master_ipv4_cidr_block" {
  description = "CIDR block for master"
  type        = string
  default     = "172.16.0.0/28"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# ============================================================
# NODE POOL DEFAULTS
# ============================================================
variable "node_pools" {
  description = "Map of node pools"
  type = map(object({
    machine_type       = string
    min_nodes          = number
    max_nodes          = number
    disk_size_gb       = number
    disk_type          = string
    labels             = map(string)
    taints             = list(object({ key = string, value = string, effect = string }))
    autoscaling        = bool
    spot               = bool
    image_type         = string
  }))
  default = {
    "system" = {
      machine_type       = "e2-standard-4"
      min_nodes          = 1
      max_nodes          = 3
      disk_size_gb       = 50
      disk_type          = "pd-ssd"
      labels             = { "workload-type" = "system" }
      taints             = [{ key = "CriticalAddonsOnly", value = "true", effect = "NO_SCHEDULE" }]
      autoscaling        = true
      spot               = false
      image_type         = "COS_CONTAINERD"
    },
    "backend" = {
      machine_type       = "n2-standard-4"
      min_nodes          = 2
      max_nodes          = 10
      disk_size_gb       = 100
      disk_type          = "pd-ssd"
      labels             = { "workload-type" = "backend" }
      taints             = []
      autoscaling        = true
      spot               = false
      image_type         = "COS_CONTAINERD"
    },
    "frontend" = {
      machine_type       = "e2-standard-4"
      min_nodes          = 2
      max_nodes          = 5
      disk_size_gb       = 50
      disk_type          = "pd-ssd"
      labels             = { "workload-type" = "frontend" }
      taints             = []
      autoscaling        = true
      spot               = false
      image_type         = "COS_CONTAINERD"
    },
    "monitoring" = {
      machine_type       = "n2-highmem-4"
      min_nodes          = 1
      max_nodes          = 3
      disk_size_gb       = 200
      disk_type          = "pd-ssd"
      labels             = { "workload-type" = "monitoring" }
      taints             = []
      autoscaling        = true
      spot               = false
      image_type         = "COS_CONTAINERD"
    }
  }

# ============================================================
# RESOURCES
# ============================================================

# GKE Cluster
resource "google_container_cluster" "main" {
  name               = var.cluster_name
  project            = var.project_id
  location           = var.region
  network            = var.network
  subnetwork         = var.subnetwork
  deletion_protection = var.environment == "prod"

  remove_default_node_pool = true
  initial_node_count       = 1

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Private cluster
  private_cluster_config {
    enable_private_nodes    = var.enable_private_nodes
    enable_private_endpoint = var.enable_private_endpoint
    master_ipv4_cidr_block  = var.master_ipv4_cidr_block
  }

  # Binary Authorization (for production)
  binary_authorization {
    evaluation_mode = var.environment == "prod" ? "PROJECT_SINGLETON_POLICY_ENFORCE" : "DISABLED"
  }

  # Shielded Nodes
  shielded_nodes {
    enabled = true
  }

  # Release channel
  release_channel {
    channel = var.environment == "prod" ? "STABLE" : "REGULAR"
  }

  # Maintenance window
  maintenance_policy {
    daily_maintenance_window {
      start_time = "04:00"
    }
    recurrence_rule = "FREQ=WEEKLY;BYDAY=SU"
  }

  # Logging and monitoring
  logging_config {
    component_config {
      enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
    }
  }

  monitoring_config {
    component_config {
      enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
    }
  }

  # Vertical Pod Autoscaling
  vertical_pod_autoscaling {
    enabled = true
  }

  # Network policy
  network_policy {
    enabled = true
    provider = "CALICO"
  }

  # Database encryption
  database_encryption {
    state = "ENCRYPTED"
  }

  # Tags
  labels = merge(var.tags, {
    environment = var.environment
  })

  # Depends on subnetwork being ready
  depends_on = [google_compute_subnetwork.subnet]
}

# ============================================================
# NODE POOLS
# ============================================================

resource "google_container_node_pool" "pools" {
  for_each = var.node_pools

  name       = "${var.cluster_name}-${each.key}"
  project    = var.project_id
  location   = var.region
  cluster    = google_container_cluster.main.name
  node_count = each.value.min_nodes

  # Node config
  node_config {
    machine_type = each.value.machine_type
    disk_size_gb = each.value.disk_size_gb
    disk_type    = each.value.disk_type
    image_type   = each.value.image_type
    spot         = each.value.spot

    # Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    # Service account for workload identity
    service_account = google_service_account.node_pool[each.key].email

    # Labels
    labels = merge({
      "environment" = var.environment
      "node-pool"   = each.key
    }, each.value.labels)

    # Taints
    dynamic "taint" {
      for_each = each.value.taints
      content {
        key    = taint.value.key
        value  = taint.value.value
        effect = taint.value.effect
      }
    }

    # Shielded instance
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    # Confidential computing (if supported)
    confidential_nodes {
      enabled = var.environment == "prod"
    }
  }

  # Autoscaling
  autoscaling {
    min_node_count = each.value.min_nodes
    max_node_count = each.value.max_nodes
  }

  # Management
  management {
    auto_repair  = true
    auto_upgrade = true
  }

  # Upgrade settings
  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
    strategy       = "SURGE"
  }

  # Node pool labels
  labels = merge(var.tags, {
    environment = var.environment
    node-pool   = each.key
  })

  # Tags
  tags = merge(var.tags, {
    environment = var.environment
    node-pool   = each.key
  })
}

# Service accounts for node pools
resource "google_service_account" "node_pool" {
  for_each = var.node_pools

  account_id   = "${var.environment}-${each.key}-node"
  display_name = "${var.environment} ${each.key} node pool"
  project      = var.project_id
}

# IAM bindings for workload identity
resource "google_service_account_iam_binding" "workload_identity" {
  for_each = var.node_pools

  service_account_id = google_service_account.node_pool[each.key].name
  role               = "roles/iam.workloadIdentityUser"
  members            = ["serviceAccount:${var.project_id}.svc.id.goog[insightflow-${var.environment}/insightflow-${each.key}]"]
}

# ============================================================
# ADDITIONAL RESOURCES
# ============================================================

# Private Service Connect for Cloud SQL
resource "google_compute_network" "peering" {
  name        = "${var.environment}-vpc-peering"
  project     = var.project_id
  description = "VPC peering for Cloud SQL"
  network     = var.network
}

resource "google_service_networking_connection" "private_ip" {
  project             = var.project_id
  network             = var.network
  reserved_peering_ranges = ["${var.environment}-sql-peering"]
  depends_on = [google_compute_network.peering]
}

# DNS zone for cluster
resource "google_dns_managed_zone" "cluster" {
  name        = "${var.environment}-cluster-dns"
  dns_name    = "cluster.${var.environment}.insightflow.edu."
  description = "DNS zone for GKE cluster"
  project     = var.project_id
}

# ============================================================
# OUTPUTS
# ============================================================

output "cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.main.name
}

output "cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = google_container_cluster.main.endpoint
}

output "cluster_ca_certificate" {
  description = "Cluster CA certificate"
  value       = google_container_cluster.main.master_auth[0].cluster_ca_certificate
}

output "cluster_location" {
  description = "Cluster location"
  value       = google_container_cluster.main.location
}

output "node_pool_names" {
  description = "Node pool names"
  value       = { for k, v in google_container_node_pool.pools : k => v.name }
}

output "service_account_emails" {
  description = "Node pool service account emails"
  value       = { for k, v in google_service_account.node_pool : k => v.email }
}

output "workload_identity_pool" {
  description = "Workload Identity pool"
  value       = google_container_cluster.main.workload_identity_config[0].workload_pool
}