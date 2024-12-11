# Set common variables for the environment. This is automatically pulled in in the root terragrunt.hcl configuration to
# feed forward to the child modules.
locals {
  env = "dev"
  project = "nft-maas-fe"
  internal_url_name = "dev.nftmaasfe.local"

#common values for services
  cpu = 256
  memory = 512
  desired_capacity = 1

#certificate for *.env.marketplace.vechain.org

  certificate_arn = "arn:aws:acm:eu-west-1:173505050344:certificate/3eea1109-88fe-43b7-b9f8-e82f2576ad2c"
  kms_key_id              = "a3e3aa58-2220-4b1e-ac3f-bffe22b522df"

}
