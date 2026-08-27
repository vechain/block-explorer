variable "name" {
  type        = string
  description = "Full resource name, e.g. block-explorer-dev-frontend. Used for the log group, both IAM roles, the task family and the service."
}

variable "aws_region" {
  type        = string
  description = "Region for the log configuration."
}

variable "cluster_arn" {
  type        = string
  description = "ECS cluster to run in."
}

variable "container_name" {
  type        = string
  description = "Container name. Must match what the load balancer target references."
  default     = "app"
}

variable "image" {
  type        = string
  description = "Fully qualified image reference including tag."
}

variable "container_port" {
  type        = number
  description = "Port the container listens on."
}

variable "cpu" {
  type        = number
  description = "Task CPU units."
}

variable "memory" {
  type        = number
  description = "Task memory in MiB. Needs headroom for the sidecar when one is attached."
}

variable "desired_count" {
  type        = number
  description = "Number of tasks to run."
}

variable "subnet_ids" {
  type        = list(string)
  description = "Private subnets with NAT egress."
}

variable "security_group_ids" {
  type        = list(string)
  description = "Security groups for the task ENIs."
}

variable "target_group_arn" {
  type        = string
  description = "ALB target group the service registers into."
}

variable "health_check_path" {
  type        = string
  description = "Path the in-container health check probes. The ALB probes the same path via the target group."
  default     = "/api/health"
}

variable "environment" {
  type        = map(string)
  description = "Plain runtime environment variables."
  default     = {}
}

variable "secrets" {
  type        = map(string)
  description = "Environment variables sourced from Secrets Manager, as name => secret ARN. The execution role is granted GetSecretValue on exactly these ARNs."
  default     = {}
}

variable "log_retention_days" {
  type        = number
  description = "CloudWatch log retention for the service."
}

variable "extra_container_definitions" {
  type        = list(any)
  description = "Sidecar containers appended to the task definition. Empty until the AMP workspace exists."
  default     = []
}

variable "task_role_policy_json" {
  type        = string
  description = "Inline policy for the task role. Null leaves the role empty, which is the default because the app makes no AWS API calls of its own."
  default     = null
}

variable "deployment_minimum_healthy_percent" {
  type        = number
  description = "Set to 0 for previews, where a single task may be replaced outright, and 100 for prod."
  default     = 50
}

variable "cpu_architecture" {
  type        = string
  description = "X86_64 or ARM64, and it must match the image: a mismatch fails the task at start with no useful error on the target group. Safe on ARM64 only because deploy-dev.yml copies the GHCR manifest list into ECR instead of flattening it to one platform."
  default     = "ARM64"

  validation {
    condition     = contains(["X86_64", "ARM64"], var.cpu_architecture)
    error_message = "cpu_architecture must be X86_64 or ARM64."
  }
}

variable "terraform_owns_task_definition" {
  type        = bool
  description = "True for previews, where an apply with a new image tag is what rolls the service. False for dev and prod, where the deploy workflow moves the pointer with `aws ecs update-service` and Terraform must not roll it back."
  default     = false
}

variable "health_check_grace_period_seconds" {
  type        = number
  description = "How long the ALB health check is ignored after a task starts. Must clear the container health check's 60s start period plus its three 30s retries."
  default     = 180
}

variable "autoscaling_max_capacity" {
  type        = number
  description = "Ceiling for CPU target tracking. Null leaves the service at a fixed desired_count, which is what previews want."
  default     = null
}

variable "autoscaling_cpu_target" {
  type        = number
  description = "Average CPU utilisation the tracking policy holds the service at."
  default     = 60
}
