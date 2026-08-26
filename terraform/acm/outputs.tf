output "certificate_arn" {
  description = "ARN of the ISSUED certificate. Only resolves once ACM has accepted the validation record, so edge/ reading this cannot attach a pending cert to a listener."
  value       = aws_acm_certificate_validation.main.certificate_arn
}

output "domain" {
  description = "Domain the certificate covers, from the env YAML."
  value       = local.env.domain
}

output "public_zone_id" {
  description = "Route53 zone ID the validation record went into. edge/ reuses it for the ALB alias record."
  value       = data.aws_route53_zone.public.zone_id
}

output "terraform_workspace" {
  description = "Current Terraform workspace (dev or prod). Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
