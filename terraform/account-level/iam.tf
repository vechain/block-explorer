################################################################################
# IAM Roles for App Runner
################################################################################

# Instance Role - Used by the application container
# Add policies here if frontend application needs to access AWS services (S3, DynamoDB, etc.)
resource "aws_iam_role" "app_runner_instance_role" {
  name = "block-explorer-app-runner-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "block-explorer-app-runner-instance-role"
  }
}

# Access Role - Used by App Runner to pull images from ECR
resource "aws_iam_role" "app_runner_access_role" {
  name = "block-explorer-app-runner-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "block-explorer-app-runner-access-role"
  }
}

# Attach AWS managed policy for ECR access
resource "aws_iam_role_policy_attachment" "app_runner_ecr_access" {
  role       = aws_iam_role.app_runner_access_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# App Runner resolves runtime_environment_secrets with the instance role. Scoped by name
# prefix so the frontend workspace can add secrets without a change here.
resource "aws_iam_role_policy" "app_runner_instance_secrets" {
  name = "block-explorer-secrets-read"
  role = aws_iam_role.app_runner_instance_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "secretsmanager:GetSecretValue"
        Resource = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:block-explorer/*"
      }
    ]
  })
}
