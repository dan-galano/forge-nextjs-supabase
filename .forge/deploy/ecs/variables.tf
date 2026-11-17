# Forge apps/modules/ecs — input variables.
#
# The ECS Fargate adapter (RFC-0089 Phase 4) applies this module against
# the RFC-0083 app-runtime clusters (staging / internal_prod / public_prod).
# The Go adapter in pkg/deploy/ecs renders these variables from a
# deploy.Spec + Config via RenderTFVars and shells `tofu apply`.
#
# Cluster / SG / task-exec role ARNs come from RFC-0083 outputs, threaded
# through the adapter's Config (populated at boot from env vars). This
# module never selects a cluster itself — the adapter owns that decision
# via its constructor's Env.

variable "app_id" {
  description = "The App's UUIDv7 — used only for tagging (per-App cloud primitives are named by slug, not id, because AWS name lengths are tighter than a UUID)."
  type        = string
  validation {
    condition     = can(regex("^[0-9a-f-]{36}$", var.app_id))
    error_message = "app_id must be a 36-character UUID string."
  }
}

variable "app_slug" {
  description = "The App's slug (pkg/deploy.AppSlugPattern). Drives task-family, service, target-group, log-group, and host-header names."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]{1,32}$", var.app_slug))
    error_message = "app_slug must be 1-32 chars, lowercase alphanumeric plus hyphens (pkg/deploy.AppSlugPattern)."
  }
}

variable "image_digest" {
  description = "OCI image digest (sha256:...) to pull. D-65 promote-by-digest — never a tag."
  type        = string
  validation {
    condition     = can(regex("^sha256:[a-f0-9]{64}$", var.image_digest))
    error_message = "image_digest must be a canonical OCI digest of the form sha256:<64 hex chars>."
  }
}

variable "ecr_registry" {
  description = "ECR registry hostname (e.g. 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com). Combined with ecr_repo and image_digest to form the pull reference."
  type        = string
}

variable "ecr_repo" {
  description = "ECR repository name (e.g. forge.app.<slug>). Combined with ecr_registry and image_digest."
  type        = string
}

variable "env" {
  description = "Deploy tier — drives the ALB / Route53 zone selection and matches the adapter's baked-in Env (staging / internal_prod / public_prod). Not to be confused with FORGE_ENV (dev / beta / prod), which is a Forge substrate concept."
  type        = string
  validation {
    condition     = contains(["staging", "internal_prod", "public_prod"], var.env)
    error_message = "env must be one of: staging, internal_prod, public_prod."
  }
}

variable "exposure" {
  description = "D-20 exposure — internal or public. Meaningful only for the *_prod envs (staging carries no exposure of its own; it follows the deployment posture)."
  type        = string
  default     = "internal"
  validation {
    condition     = contains(["internal", "public"], var.exposure)
    error_message = "exposure must be one of: internal, public."
  }
}

# --- Substrate ARNs from RFC-0083 --------------------------------------------

variable "cluster_arn" {
  description = "RFC-0083 app-runtime ECS cluster ARN for this env. Threaded from the adapter's Config."
  type        = string
  validation {
    condition     = can(regex("^arn:aws:ecs:", var.cluster_arn))
    error_message = "cluster_arn must be a full arn:aws:ecs:... ARN."
  }
}

variable "security_group_ids" {
  description = "RFC-0083 per-tier security-group IDs. The service's ENI attaches to these."
  type        = list(string)
  validation {
    condition     = length(var.security_group_ids) > 0
    error_message = "security_group_ids must not be empty."
  }
}

variable "subnet_ids" {
  description = "Private subnet IDs in Foundation's VPC. The service's ENI is placed here."
  type        = list(string)
  validation {
    condition     = length(var.subnet_ids) > 0
    error_message = "subnet_ids must not be empty."
  }
}

variable "task_exec_role_arn" {
  description = "RFC-0083 app-runtime task-EXECUTION role ARN — grants the ECS agent ECR pull + logs + Secrets Manager GetSecretValue on the tier's secret prefix. Distinct from task_role_arn (the runtime data-plane identity)."
  type        = string
  validation {
    condition     = can(regex("^arn:aws:iam::[0-9]+:role/", var.task_exec_role_arn))
    error_message = "task_exec_role_arn must be a full arn:aws:iam::<account>:role/... ARN."
  }
}

variable "task_role_arn" {
  description = "RFC-0083 app-runtime task role ARN — the *runtime* identity of the deployed App. Distinct from task_exec_role_arn."
  type        = string
  validation {
    condition     = can(regex("^arn:aws:iam::[0-9]+:role/", var.task_role_arn))
    error_message = "task_role_arn must be a full arn:aws:iam::<account>:role/... ARN."
  }
}

# --- ALB / DNS ---------------------------------------------------------------

variable "alb_listener_arn" {
  description = "RFC-0083 ALB listener ARN for this env's exposure. The module creates a listener rule off this listener with a host-header matching the App's live URL."
  type        = string
  validation {
    condition     = can(regex("^arn:aws:elasticloadbalancing:", var.alb_listener_arn))
    error_message = "alb_listener_arn must be a full arn:aws:elasticloadbalancing:... ARN."
  }
}

variable "vpc_id" {
  description = "VPC ID hosting the ALB. Required for target-group creation."
  type        = string
  validation {
    condition     = can(regex("^vpc-", var.vpc_id))
    error_message = "vpc_id must start with vpc-."
  }
}

variable "parent_zone" {
  # NOTE the $$ escapes: HCL interpolates $${...} in a description string, and
  # the unescaped form was a hard syntax error that made `tofu init` fail for
  # this whole module. It went unnoticed because the iac CI job only covers
  # deploy/forge, and the module's own plan test had never been run (RFC-0099).
  description = "The DNS zone the live_url is a subdomain of (e.g. app.nmblr.dev). The full live_url is https://$${app_slug}.$${env-subdomain}.$${parent_zone}."
  type        = string
}

# --- Container shape ---------------------------------------------------------

variable "container_port" {
  description = "The port the container exposes (matches the image's Dockerfile EXPOSE)."
  type        = number
  default     = 80
  validation {
    condition     = var.container_port > 0 && var.container_port < 65536
    error_message = "container_port must be a valid TCP port (1-65535)."
  }
}

variable "cpu" {
  description = "Fargate task CPU units. 256 = 0.25 vCPU. Sensible default for a small SPA/SSR app."
  type        = number
  default     = 256
}

variable "memory" {
  description = "Fargate task memory (MiB). Must match a valid CPU/memory combination."
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Number of service tasks. 1 for MVP; autoscaling is a follow-up RFC (§Open Questions Deferred OQ-4)."
  type        = number
  default     = 1
}

variable "log_retention_days" {
  description = "Retention on the per-App CloudWatch log group. Matches Path A defaults."
  type        = number
  default     = 7
}

# --- Capability bindings (TD-0013 gate) --------------------------------------

variable "bindings" {
  description = "Capability environment entries. Each entry is {env_name, secret_arn} — SecretARN, NEVER a plaintext value. Wired into containerDefinitions[].secrets (NEVER .environment). This is the TD-0013 gate at the module level: an entry with a plaintext value would fail SSM/Secrets-Manager resolution at task-start."
  type = list(object({
    env_name   = string
    secret_arn = string
  }))
  default = []
  validation {
    condition = alltrue([
      for b in var.bindings : can(regex("^arn:aws:(secretsmanager|ssm):", b.secret_arn))
    ])
    error_message = "Every binding.secret_arn must be a full arn:aws:secretsmanager:... or arn:aws:ssm:... ARN (TD-0013 gate — no plaintext values)."
  }
}

# --- App Configuration: plaintext container environment (D-198) ------------
#
# The App's own non-secret configuration — RFC-0134 App Configuration `config`
# variables for this deploy env — as plain entries on the `web` container,
# AFTER the four FORGE_* entries main.tf always sets (FORGE_APP_SLUG,
# FORGE_APP_ID, FORGE_RELEASE_ID and RFC-0180's FORGE_SEED_ENV). App
# Configuration `secret` variables never arrive here: Dispatch sends them as
# `bindings`, by ARN, so they land in `secrets[]` like a capability's.
#
# Same {name, value} shape a sidecar's environment uses. Readable by anyone
# with ecs:DescribeTaskDefinition and printed in a plan, which is why only
# `config` variables — values the builder declared non-secret — are sent.
#
# PRECEDENCE IS ENFORCED, NOT IMPLIED. A name colliding with a FORGE_* name or
# with a binding would be a duplicate key in the container, and ECS does not
# promise which one wins. Dispatch drops such a variable before it dispatches
# (Forge and capability names win, D-198); these validations and the one in
# main.tf's lifecycle precondition are the copy that runs in the customer's
# repo, so a hand-dispatched spec cannot override a Forge-provided variable.

variable "environment" {
  description = "App Configuration `config` variables for this deploy env (D-198): plaintext {name, value} entries on the web container, after FORGE_APP_SLUG / FORGE_APP_ID / FORGE_RELEASE_ID / FORGE_SEED_ENV. Never a secret — App Configuration secrets travel as `bindings` ARNs. Names are env-var shaped, unique, never FORGE_*, and never a binding's env_name."
  type = list(object({
    name  = string
    value = string
  }))
  default = []

  validation {
    condition = alltrue([
      for e in var.environment : can(regex("^[A-Z_][A-Z0-9_]*$", e.name))
    ])
    error_message = "Every environment[].name must match ^[A-Z_][A-Z0-9_]*$ — the RFC-0134 variable-name charset."
  }

  validation {
    condition     = length(distinct([for e in var.environment : e.name])) == length(var.environment)
    error_message = "environment[].name must be unique — a duplicate would leave ECS to pick which value the App sees."
  }

  validation {
    condition = alltrue([
      for e in var.environment : !startswith(e.name, "FORGE_")
    ])
    error_message = "No environment[].name may start with FORGE_ — that namespace is Forge's own (FORGE_APP_SLUG, FORGE_APP_ID, FORGE_RELEASE_ID, FORGE_SEED_ENV), and a builder's variable must never override it (D-198)."
  }
}

variable "release_id" {
  description = "The releases-row UUIDv7 this apply fulfils — attached as a tag for audit correlation."
  type        = string
  default     = ""
}

# --- Sidecar containers (RFC-0117) -------------------------------------------
#
# Extra containers registered in the App's task definition alongside its own
# `web` container. They share the task's network namespace (awsvpc), so the App
# reaches them over loopback and NOTHING else reaches them at all. The auth
# capability's per-App Kratos is the first and, at time of writing, only user.
#
# The shape mirrors pkg/deploy.Sidecar (pkg/deploy/spec.go) key for key, with
# the same tfvars-layer spelling `bindings` already established: this layer
# says env_name / secret_arn, and main.tf maps those onto ECS's name /
# valueFrom at the point of jsonencode. ECS's camelCase does not leak up here.
#
# THREE THINGS KEEP A SIDECAR TASK-INTERNAL, and all three are load-bearing:
#   1. aws_ecs_service.app's load_balancer { container_name = "web" } — the
#      target group can only ever route to the App's own container.
#   2. The name "web" is refused below, so no sidecar can take that slot.
#   3. There is no ports/portMappings attribute on this type, and main.tf
#      emits none. Absence, not configuration, is the enforcement.

variable "sidecars" {
  description = "Extra containers to register in the task definition beside `web`. Each is {name, image, environment, secrets}. `environment` is PLAINTEXT non-secret config (inline in the task-def, readable by anyone with ecs:DescribeTaskDefinition); `secrets` is {env_name, secret_arn} — ARNs only, NEVER values, the same TD-0013 gate `bindings` carries. Images are digest-pinned (D-65). Sidecars get no portMappings: awsvpc gives them loopback for free and the absence makes external reachability structurally impossible."
  type = list(object({
    name  = string
    image = string
    environment = optional(list(object({
      name  = string
      value = string
    })), [])
    secrets = optional(list(object({
      env_name   = string
      secret_arn = string
    })), [])
  }))
  default = []

  validation {
    condition = alltrue([
      for s in var.sidecars : length(trimspace(s.name)) > 0
    ])
    error_message = "Every sidecar.name must be non-empty — it is the ECS container name and the log-stream suffix."
  }

  validation {
    condition     = length(distinct([for s in var.sidecars : s.name])) == length(var.sidecars)
    error_message = "sidecar.name must be unique within the task definition — ECS rejects a task-def with two containers of the same name."
  }

  # R-15. The reason lives in the message on purpose: whoever trips this is
  # about to lose the load balancer, and a comment in a file they are not
  # reading will not tell them.
  validation {
    condition = alltrue([
      for s in var.sidecars : s.name != "web"
    ])
    error_message = "No sidecar may be named \"web\". aws_ecs_service.app's load_balancer block hardcodes container_name = \"web\", and that hardcoding is the only reason a sidecar is unreachable from the ALB: the target group routes to the container with that name and to nothing else. A sidecar taking the name would collide with the App's own container AND inherit its ingress — turning task-internal-by-construction into externally-reachable-by-accident. Rename the sidecar."
  }

  # R-14 / D-65. Same rule var.image_digest is held to, applied to the bytes
  # running BESIDE the App: a floating tag would let those bytes change
  # between staging and production without a release.
  validation {
    condition = alltrue([
      for s in var.sidecars : can(regex("@sha256:[a-f0-9]{64}$", s.image))
    ])
    error_message = "Every sidecar.image must be digest-pinned — it must end in @sha256:<64 hex chars>. A floating tag is refused (D-65 promote-by-digest)."
  }

  # R-14 / TD-0013. The bindings variable's regex and message shape,
  # transliterated onto the nested secrets list. Deliberately the same
  # `^arn:aws:(secretsmanager|ssm):` check and not a weaker "non-empty" one,
  # because "non-empty" is exactly what lets a plaintext value through.
  validation {
    condition = alltrue(flatten([
      for s in var.sidecars : [
        for b in s.secrets : can(regex("^arn:aws:(secretsmanager|ssm):", b.secret_arn))
      ]
    ]))
    error_message = "Every sidecar secret's secret_arn must be a full arn:aws:secretsmanager:... or arn:aws:ssm:... ARN (TD-0013 gate — no plaintext values)."
  }
}
