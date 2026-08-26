################################################################################
# Hosted Zone & DNS Record creation
################################################################################
resource "aws_route53_zone" "block_explorer_public_zone_prod" {
  name = "block-explorer.vechain.org"

  tags = {
    Name        = "block-explorer.vechain.org"
    Environment = "production"
    Project     = "block-explorer"
    Terraform   = "true"
  }
}

resource "aws_route53_zone" "block_explorer_public_zone_preview" {
  name = "block-explorer-preview.vechain.org"

  tags = {
    Name        = "block-explorer-preview.vechain.org"
    Environment = "preview"
    Project     = "block-explorer"
    Terraform   = "true"
  }
}
