# AWS EKS Module
# Creates a production-grade EKS cluster with managed node groups

# ============================================================
# VARIABLES
# ============================================================
variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "cluster_endpoint_public_access" {
  description = "Enable public access to cluster endpoint"
  type        = bool
  default     = true
}

variable "cluster_endpoint_private_access" {
  description = "Enable private access to cluster endpoint"
  type        = bool
  default     = true
}

variable "cluster_log_retention_days" {
  description = "CloudWatch log retention days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# ============================================================
# MANAGED NODE GROUP DEFAULTS
# ============================================================
variable "managed_node_groups" {
  description = "Map of managed node groups"
  type = map(object({
    instance_types     = list(string)
    capacity_type      = string
    min_size           = number
    max_size           = number
    desired_size       = number
    disk_size          = number
    labels             = map(string)
    taints             = list(object({ key = string, value = string, effect = string }))
    ami_type           = string
  }))
  default = {
    "system" = {
      instance_types     = ["t3.medium"]
      capacity_type      = "ON_DEMAND"
      min_size           = 1
      max_size           = 3
      desired_size       = 2
      disk_size          = 50
      labels             = { "workload-type" = "system" }
      taints             = [{ key = "CriticalAddonsOnly", value = "true", effect = "NO_SCHEDULE" }]
      ami_type           = "AL2_x86_64"
    },
    "backend" = {
      instance_types     = ["t3.large", "t3.xlarge"]
      capacity_type      = "ON_DEMAND"
      min_size           = 2
      max_size           = 10
      desired_size       = 3
      disk_size          = 100
      labels             = { "workload-type" = "backend" }
      taints             = []
      ami_type           = "AL2_x86_64"
    },
    "frontend" = {
      instance_types     = ["t3.medium"]
      capacity_type      = "ON_DEMAND"
      min_size           = 2
      max_size           = 5
      desired_size       = 2
      disk_size          = 50
      labels             = { "workload-type" = "frontend" }
      taints             = []
      ami_type           = "AL2_x86_64"
    },
    "monitoring" = {
      instance_types     = ["r6g.xlarge"]
      capacity_type      = "ON_DEMAND"
      min_size           = 1
      max_size           = 3
      desired_size       = 1
      disk_size          = 200
      labels             = { "workload-type" = "monitoring" }
      taints             = []
      ami_type           = "AL2_ARM_64"
    }
  }

# ============================================================
# RESOURCES
# ============================================================

# EKS Cluster Role
resource "aws_iam_role" "cluster" {
  name = "${var.environment}-eks-cluster"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = merge(var.tags, {
    Name        = "${var.environment}-eks-cluster-role"
    Environment = var.environment
  })
}

resource "aws_iam_role_policy_attachment" "cluster" {
  role       = aws_iam_role.cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role_policy_attachment" "cluster_service" {
  role       = aws_iam_role.cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSServicePolicy"
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.cluster.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = var.cluster_endpoint_private_access
    endpoint_public_access  = var.cluster_endpoint_public_access
    public_access_cidrs     = ["0.0.0.0/0"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  kubernetes_network_config {
    service_ipv4_cidr = "10.100.0.0/16"
    ip_family         = "ipv4"
  }

  tags = merge(var.tags, {
    Name        = var.cluster_name
    Environment = var.environment
  })
}

# CloudWatch Log Group for cluster logs
resource "aws_cloudwatch_log_group" "cluster" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = var.cluster_log_retention_days

  tags = merge(var.tags, {
    Name        = "${var.environment}-eks-cluster-logs"
    Environment = var.environment
  })
}

# Managed Node Groups
resource "aws_eks_node_group" "managed" {
  for_each = var.managed_node_groups

  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.environment}-${each.key}"
  node_role_arn   = aws_iam_role.node_group[each.key].arn
  subnet_ids      = var.private_subnet_ids
  instance_types  = each.value.instance_types
  capacity_type   = each.value.capacity_type
  ami_type        = each.value.ami_type
  disk_size       = each.value.disk_size

  scaling_config {
    min_size     = each.value.min_size
    max_size     = each.value.max_size
    desired_size = each.value.desired_size
  }

  labels = merge({
    "environment" = var.environment
  }, each.value.labels)

  taints = each.value.taints

  update_config {
    max_unavailable_percentage = 25
  }

  launch_template {
    id      = aws_launch_template.node_group[each.key].id
    version = "$Latest"
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-${each.key}-node-group"
    Environment = var.environment
  })

  depends_on = [aws_iam_role_policy_attachment.node_group[each.key]]
}

# Node Group IAM Role
resource "aws_iam_role" "node_group" {
  for_each = var.managed_node_groups

  name = "${var.environment}-eks-node-group-${each.key}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = merge(var.tags, {
    Name        = "${var.environment}-eks-node-group-${each.key}-role"
    Environment = var.environment
  })
}

resource "aws_iam_role_policy_attachment" "node_group" {
  for_each = var.managed_node_groups

  role       = aws_iam_role.node_group[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "node_group_cni" {
  for_each = var.managed_node_groups

  role       = aws_iam_role.node_group[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "node_group_container_registry" {
  for_each = var.managed_node_groups

  role       = aws_iam_role.node_group[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "node_group_ssm" {
  for_each = var.managed_node_groups

  role       = aws_iam_role.node_group[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Launch Template for Node Groups
resource "aws_launch_template" "node_group" {
  for_each = var.managed_node_groups

  name = "${var.environment}-eks-node-group-${each.key}"

  image_id = data.aws_eks_optimized_ami.this[each.key].image_id
  instance_type = each.value.instance_types[0]

  vpc_security_group_ids = [aws_security_group.node_group.id]

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    cluster_name = var.cluster_name
    node_group_name = "${var.environment}-${each.key}"
    labels = each.value.labels
    taints = each.value.taints
  }))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = each.value.disk_size
      volume_type = "gp3"
      encrypted   = true
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.tags, {
      Name        = "${var.environment}-${each.key}-node"
      Environment = var.environment
      "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    })
  }
}

# Security Group for Node Groups
resource "aws_security_group" "node_group" {
  name        = "${var.environment}-eks-node-group"
  description = "Security group for EKS node groups"
  vpc_id      = data.aws_vpc.selected.id

  ingress {
    from_port   = 10250
    to_port     = 10250
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.selected.cidr_block]
  }

  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.selected.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-eks-node-group-sg"
    Environment = var.environment
  })
}

# Data source for EKS optimized AMI
data "aws_eks_optimized_ami" "this" {
  for_each = var.managed_node_groups

  kubernetes_version = var.kubernetes_version
  ami_type           = each.value.ami_type
}

# VPC data source
data "aws_vpc" "selected" {
  id = var.vpc_id
}

# ============================================================
# ADDONS
# ============================================================

# VPC CNI Addon
resource "aws_eks_addon" "vpc_cni" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "vpc-cni"
  resolve_conflicts = "OVERWRITE"

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# CoreDNS Addon
resource "aws_eks_addon" "coredns" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "coredns"
  resolve_conflicts = "OVERWRITE"

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Kube Proxy Addon
resource "aws_eks_addon" "kube_proxy" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "kube-proxy"
  resolve_conflicts = "OVERWRITE"

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# EBS CSI Driver Addon (for persistent volumes)
resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "aws-ebs-csi-driver"
  resolve_conflicts = "OVERWRITE"

  service_account_role_arn = aws_iam_role.ebs_csi_driver.arn

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# EBS CSI Driver IAM Role
resource "aws_iam_role" "ebs_csi_driver" {
  name = "${var.environment}-ebs-csi-driver"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${aws_iam_openid_connect_provider.eks.arn}:sub" = "system:serviceaccount:kube-system:ebs-csi-controller-sa"
        }
      }
    }]
  })

  tags = merge(var.tags, {
    Name        = "${var.environment}-ebs-csi-driver-role"
    Environment = var.environment
  })
}

resource "aws_iam_policy" "ebs_csi_driver" {
  name = "${var.environment}-ebs-csi-driver-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ec2:AttachVolume",
        "ec2:CreateSnapshot",
        "ec2:CreateTags",
        "ec2:CreateVolume",
        "ec2:DeleteSnapshot",
        "ec2:DeleteTags",
        "ec2:DeleteVolume",
        "ec2:DescribeInstances",
        "ec2:DescribeSnapshots",
        "ec2:DescribeTags",
        "ec2:DescribeVolumes",
        "ec2:DetachVolume"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ebs_csi_driver" {
  role       = aws_iam_role.ebs_csi_driver.name
  policy_arn = aws_iam_policy.ebs_csi_driver.arn
}

# ============================================================
# DATA SOURCES
# ============================================================
data "aws_vpc" "selected" {
  id = var.vpc_id
}

# OIDC Provider
data "aws_iam_openid_connect_provider" "eks" {
  arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/oidc.eks.${data.aws_region.current.name}.amazonaws.com/id/${aws_eks_cluster.main.id}"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# ============================================================
# OUTPUTS
# ============================================================
output "cluster_id" {
  description = "EKS cluster ID"
  value       = aws_eks_cluster.main.id
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = aws_eks_cluster.main.arn
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Cluster CA certificate"
  value       = aws_eks_cluster.main.certificate_authority[0].data
}

output "cluster_oidc_provider_arn" {
  description = "OIDC provider ARN"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "node_group_arns" {
  description = "Managed node group ARNs"
  value       = { for k, v in aws_eks_node_group.managed : k => v.arn }
}