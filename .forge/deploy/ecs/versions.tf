# Forge apps/modules/ecs — provider pins.
#
# AWS-only module (RFC-0089 Phase 4). Same pin as
# deploy/forge/modules/ecs-clusters/ so a Dispatch container carrying a
# single tofu binary applies both substrate + per-App modules without
# provider negotiation.

terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
  }
}
