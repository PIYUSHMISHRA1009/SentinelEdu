# AWS RDS Module
# Creates a production-grade PostgreSQL database with encryption, backup, and monitoring

# ============================================================
# VARIABLES
# ============================================================
variable "identifier" {
  description = "Database identifier"
  type        = string
  default     = "insightflow"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "database_subnet_ids" {
  description = "Database subnet IDs"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
}

variable "engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "instance_class" {
  description = "DB instance class"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "max_allocated_storage" {
  description = "Max allocated storage for autoscaling"
  type        = number
  default     = 500
}

variable "storage_encrypted" {
  description = "Enable storage encryption"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = ""
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

variable "backup_window" {
  description = "Backup window (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Maintenance window (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

variable "username" {
  description = "Master username"
  type        = string
  default     = "insightflow"
}

variable "password" {
  description = "Master password (use secret in production)"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# ============================================================
# RESOURCES
# ============================================================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-${var.identifier}-subnet-group"
  subnet_ids = var.database_subnet_ids

  tags = merge(var.tags, {
    Name        = "${var.environment}-${var.identifier}-subnet-group"
    Environment = var.environment
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.environment}-${var.identifier}-rds"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.security_group_ids
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-${var.identifier}-rds-sg"
    Environment = var.environment
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier        = "${var.environment}-${var.identifier}"
  engine            = "postgres"
  engine_version    = var.engine_version
  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_encrypted = var.storage_encrypted
  kms_key_id        = var.kms_key_id != "" ? var.kms_key_id : null

  db_name           = var.identifier
  username          = var.username
  password          = var.password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window

  deletion_protection         = var.deletion_protection
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${var.environment}-${var.identifier}-final-snapshot-${formatdate("YYYYMMDD", timestamp())}"

  multi_az                    = var.multi_az
  publicly_accessible         = false

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_retention_period = 7

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Logs
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Parameter Group
  parameter_group_name = aws_db_parameter_group.main.name

  # Tags
  tags = merge(var.tags, {
    Name        = "${var.environment}-${var.identifier}"
    Environment = var.environment
  })
}

# DB Parameter Group
resource "aws_db_parameter_group" "main" {
  name   = "${var.environment}-${var.identifier}-params"
  family = "postgres15"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,auto_explain"
  }

  parameter {
    name  = "auto_explain.log_min_duration"
    value = "1000"
  }

  parameter {
    name  = "auto_explain.log_analyze"
    value = "true"
  }

  parameter {
    name  = "track_activity_query_size"
    value = "2048"
  }

  tags = merge(var.tags, {
    Name        = "${var.environment}-${var.identifier}-params"
    Environment = var.environment
  })
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.environment}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Read Replica (for staging/prod)
resource "aws_db_instance" "replica" {
  count = var.environment != "dev" ? 1 : 0

  identifier              = "${var.environment}-${var.identifier}-replica"
  replicate_source_db     = aws_db_instance.main.identifier
  instance_class          = var.instance_class
  storage_encrypted       = true
  kms_key_id              = var.kms_key_id != "" ? var.kms_key_id : null
  multi_az                = false
  publicly_accessible     = false
  deletion_protection     = var.deletion_protection
  performance_insights_enabled = true
  monitoring_interval     = 60
  monitoring_role_arn     = aws_iam_role.rds_monitoring.arn

  tags = merge(var.tags, {
    Name        = "${var.environment}-${var.identifier}-replica"
    Environment = var.environment
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.environment}-${var.identifier}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is high"
  alarm_actions       = [aws_sns_topic.rds_alarms.arn]
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "storage_low" {
  alarm_name          = "${var.environment}-${var.identifier}-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5000000000  # 5GB
  alarm_description   = "RDS free storage space is low"
  alarm_actions       = [aws_sns_topic.rds_alarms.arn]
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "connections_high" {
  alarm_name          = "${var.environment}-${var.identifier}-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS connections are high"
  alarm_actions       = [aws_sns_topic.rds_alarms.arn]
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

# SNS Topic for RDS Alarms
resource "aws_sns_topic" "rds_alarms" {
  name = "${var.environment}-${var.identifier}-rds-alarms"

  tags = merge(var.tags, {
    Name        = "${var.environment}-${var.identifier}-rds-alarms"
    Environment = var.environment
  })
}

# SNS Subscription (email)
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.rds_alarms.arn
  protocol  = "email"
  endpoint  = "alerts@insightflow.edu"
}

# ============================================================
# OUTPUTS
# ============================================================

output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_instance_username" {
  description = "Master username"
  value       = var.username
}

output "db_subnet_group_name" {
  description = "DB subnet group name"
  value       = aws_db_subnet_group.main.name
}

output "db_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "replica_endpoint" {
  description = "Read replica endpoint"
  value       = var.environment != "dev" ? aws_db_instance.replica[0].endpoint : null
}