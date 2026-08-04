# AWS IAM Module
# Creates IAM roles, policies, and OIDC providers for EKS and applications

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

variable "oidc_provider_arn" {
  description = "OIDC provider ARN for EKS cluster"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# ============================================================
# RESOURCES
# ============================================================

# OIDC Provider for EKS (created after cluster)
resource "aws_iam_openid_connect_provider" "eks" {
  count  = var.oidc_provider_arn == "" ? 1 : 0
  url    = "https://oidc.eks.${data.aws_region.current.name}.amazonaws.com/id/${data.aws_eks_cluster.main.id}"
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = ["9e99a48a9960b14926bb7f3b02e22da2b0ab7280"] # AWS EKS thumbprint

  tags = merge(var.tags, {
    Name        = "${var.environment}-eks-oidc"
    Environment = var.environment
  })
}

data "aws_eks_cluster" "main" {
  count = var.oidc_provider_arn == "" ? 1 : 0
  name  = var.cluster_name
}

data "aws_region" "current" {}

# ============================================================
# IRSA ROLES
# ============================================================

# Backend Service Account Role
resource "aws_iam_role" "backend" {
  name = "${var.environment}-insightflow-backend"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn != "" ? var.oidc_provider_arn : aws_iam_openid_connect_provider.eks[0].arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.oidc_provider_arn != "" ? var.oidc_provider_arn : aws_iam_openid_connect_provider.eks[0].arn}:sub" = "system:serviceaccount:insightflow-${var.environment}:insightflow-backend"
        }
      }
    }]
  })

  tags = merge(var.tags, {
    Name        = "${var.environment}-insightflow-backend-role"
    Environment = var.environment
  })
}

# Backend Policy
resource "aws_iam_policy" "backend" {
  name = "${var.environment}-insightflow-backend-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:insightflow/${var.environment}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "arn:aws:kms:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:key/*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::insightflow-${var.environment}-artifacts",
          "arn:aws:s3:::insightflow-${var.environment}-artifacts/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/eks/${var.cluster_name}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backend" {
  role       = aws_iam_role.backend.name
  policy_arn = aws_iam_policy.backend.arn
}

# Frontend Service Account Role
resource "aws_iam_role" "frontend" {
  name = "${var.environment}-insightflow-frontend"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn != "" ? var.oidc_provider_arn : aws_iam_openid_connect_provider.eks[0].arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.oidc_provider_arn != "" ? var.oidc_provider_arn : aws_iam_openid_connect_provider.eks[0].arn}:sub" = "system:serviceaccount:insightflow-${var.environment}:insightflow-frontend"
        }
      }
    }]
  })

  tags = merge(var.tags, {
    Name        = "${var.environment}-insightflow-frontend-role"
    Environment = var.environment
  })
}

resource "aws_iam_policy" "frontend" {
  name = "${var.environment}-insightflow-frontend-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::insightflow-${var.environment}-frontend-assets",
          "arn:aws:s3:::insightflow-${var.environment}-frontend-assets/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "frontend" {
  role       = aws_iam_role.frontend.name
  policy_arn = aws_iam_policy.frontend.arn
}

# Cluster Autoscaler Role
resource "aws_iam_role" "cluster_autoscaler" {
  name = "${var.environment}-cluster-autoscaler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn != "" ? var.oidc_provider_arn : aws_iam_openid_connect_provider.eks[0].arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.oidc_provider_arn != "" ? var.oidc_provider_arn : aws_iam_openid_connect_provider.eks[0].arn}:sub" = "system:serviceaccount:kube-system:cluster-autoscaler"
        }
      }
    }]
  })

  tags = merge(var.tags, {
    Name        = "${var.environment}-cluster-autoscaler-role"
    Environment = var.environment
  })
}

resource "aws_iam_policy" "cluster_autoscaler" {
  name = "${var.environment}-cluster-autoscaler-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeTags",
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:DescribeLaunchTemplateVersions",
          "ec2:DescribeInstanceTypes"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  role       = aws_iam_role.cluster_autoscaler.name
  policy_arn = aws_iam_policy.cluster_autoscaler.arn
}

# External DNS Role
resource "aws_iam_role" "external_dns" {
  name = "${var.environment}-external-dns"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn != "" ? var.oidc_provider_arn : aws_iam_openid_connect_provider.eks[0].arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.oidc_provider_arn != "" ? var.oidc_provider_arn : aws_iam_openid_connect_provider.eks[0].arn}:sub" = "system:serviceaccount:kube-system:external-dns"
        }
      }
    }]
  })

  tags = merge(var.tags, {
    Name        = "${var.environment}-external-dns-role"
    Environment = var.environment
  })
}

resource "aws_iam_policy" "external_dns" {
  name = "${var.environment}-external-dns-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:ListResourceRecordSets",
          "route53:ListHostedZones"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "external_dns" {
  role       = aws_iam_role.external_dns.name
  policy_arn = aws_iam_policy.external_dns.arn
}

# Cert Manager Role
resource "aws_iam_role" "cert_manager" {
  name = "${var.environment}-cert-manager"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn != "" ? var.oidc_provider_arn : aws_iam_openid_connect_provider.eks[0].arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.oidc_provider_arn != "" ? var.oidc_provider_arn : aws_iam_openid_connect_provider.eks[0].arn}:sub" = "system:serviceaccount:cert-manager:cert-manager"
        }
      }
    }]
  })

  tags = merge(var.tags, {
    Name        = "${var.environment}-cert-manager-role"
    Environment = var.environment
  })
}

resource "aws_iam_policy" "cert_manager" {
  name = "${var.environment}-cert-manager-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "route53:ListHostedZones",
          "route53:GetChange"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets"
        ]
        Resource = "arn:aws:route53:::hostedzone/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cert_manager" {
  role       = aws_iam_role.cert_manager.name
  policy_arn = aws_iam_policy.cert_manager.arn
}

# AWS Load Balancer Controller Role
resource "aws_iam_role" "aws_load_balancer_controller" {
  name = "${var.environment}-aws-load-balancer-controller"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn != "" ? var.oidc_provider_arn : aws_iam_openid_connect_provider.eks[0].arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.oidc_provider_arn != "" ? var.oidc_provider_arn : aws_iam_openid_connect_provider.eks[0].arn}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
        }
      }
    }]
  })

  tags = merge(var.tags, {
    Name        = "${var.environment}-aws-load-balancer-controller-role"
    Environment = var.environment
  })
}

resource "aws_iam_policy" "aws_load_balancer_controller" {
  name = "${var.environment}-aws-load-balancer-controller-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:CreateServiceLinkedRole",
          "ec2:DescribeAccountAttributes",
          "ec2:DescribeAddresses",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeInternetGateways",
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeInstances",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeTags",
          "ec2:GetCoipPoolUsage",
          "ec2:DescribeCoipPools",
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeLoadBalancerAttributes",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:DescribeListenerCertificates",
          "elasticloadbalancing:DescribeSSLPolicies",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeTargetGroupAttributes",
          "elasticloadbalancing:DescribeTargetHealth",
          "elasticloadbalancing:ModifyLoadBalancerAttributes",
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:ModifyTargetGroup",
          "elasticloadbalancing:ModifyTargetGroupAttributes",
          "elasticloadbalancing:CreateLoadBalancer",
          "elasticloadbalancing:CreateListener",
          "elasticloadbalancing:CreateTargetGroup",
          "elasticloadbalancing:DeleteLoadBalancer",
          "elasticloadbalancing:DeleteListener",
          "elasticloadbalancing:DeleteTargetGroup",
          "elasticloadbalancing:RegisterTargets",
          "elasticloadbalancing:DeregisterTargets",
          "elasticloadbalancing:SetIpAddressType",
          "elasticloadbalancing:SetSecurityGroups",
          "elasticloadbalancing:SetSubnets",
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:RemoveTags",
          "cognito-idp:DescribeUserPoolClient",
          "acm:DescribeCertificate",
          "acm:ListCertificates",
          "waf-regional:GetWebACL",
          "waf-regional:GetWebACLForResource",
          "waf-regional:AssociateWebACL",
          "waf-regional:DisassociateWebACL",
          "wafv2:GetWebACL",
          "wafv2:GetWebACLForResource",
          "wafv2:AssociateWebACL",
          "wafv2:DisassociateWebACL",
          "shield:GetSubscriptionState",
          "shield:DescribeProtection",
          "shield:CreateProtection",
          "shield:DeleteProtection"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "aws_load_balancer_controller" {
  role       = aws_iam_role.aws_load_balancer_controller.name
  policy_arn = aws_iam_policy.aws_load_balancer_controller.arn
}

# ============================================================
# DATA SOURCES
# ============================================================
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# ============================================================
# OUTPUTS
# ============================================================
output "backend_role_arn" {
  description = "ARN of the backend service account role"
  value       = aws_iam_role.backend.arn
}

output "frontend_role_arn" {
  description = "ARN of the frontend service account role"
  value       = aws_iam_role.frontend.arn
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of the cluster autoscaler role"
  value       = aws_iam_role.cluster_autoscaler.arn
}

output "external_dns_role_arn" {
  description = "ARN of the external DNS role"
  value       = aws_iam_role.external_dns.arn
}

output "cert_manager_role_arn" {
  description = "ARN of the cert-manager role"
  value       = aws_iam_role.cert_manager.arn
}

output "aws_load_balancer_controller_role_arn" {
  description = "ARN of the AWS load balancer controller role"
  value       = aws_iam_role.aws_load_balancer_controller.arn
}