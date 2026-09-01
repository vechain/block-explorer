# This account's own registry. The prod pipeline copies the GHCR manifest list
# in here before applying, so a release image is never pulled across accounts.
#
# dev's predates this stack and is account-level/'s, so there it is looked up
# instead — the deploy role needs its ARN either way.

moved {
  from = aws_ecr_repository.app
  to   = aws_ecr_repository.app[0]
}

moved {
  from = aws_ecr_lifecycle_policy.app
  to   = aws_ecr_lifecycle_policy.app[0]
}

data "aws_ecr_repository" "existing" {
  count = local.account.create_ecr ? 0 : 1

  name = var.ecr_repository_name
}

resource "aws_ecr_repository" "app" {
  count = local.account.create_ecr ? 1 : 0

  name                 = var.ecr_repository_name
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

# Only release tags land here — no dev- or pr- prefixes in this account — so one
# count rule covers everything tagged.
resource "aws_ecr_lifecycle_policy" "app" {
  count = local.account.create_ecr ? 1 : 0

  repository = aws_ecr_repository.app[0].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep the last 30 release images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v."]
          countType     = "imageCountMoreThan"
          countNumber   = 30
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Remove untagged images after 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = { type = "expire" }
      },
    ]
  })
}
