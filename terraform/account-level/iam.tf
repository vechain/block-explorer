################################################################################
# IAM Roles for App Runner
################################################################################

# Instance Role - Used by the application container
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

# Instance role policy - Add permissions here if the app needs to access AWS services
resource "aws_iam_role_policy" "app_runner_instance_policy" {
  name = "block-explorer-instance-policy"
  role = aws_iam_role.app_runner_instance_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
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

