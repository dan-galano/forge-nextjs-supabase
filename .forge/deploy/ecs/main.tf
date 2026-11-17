# Forge apps/modules/ecs — ECS Fargate adapter's tofu module.
#
# RFC-0089 Phase 4. Provisions everything one App needs on top of the
# RFC-0083 app-runtime cluster: task-def (by digest, secrets refs),
# service, target group, listener rule, log group.
#
# What this module does NOT do:
#   - Cluster provisioning (RFC-0083 — this module consumes cluster_arn).
#   - ALB provisioning (RFC-0083 — this module attaches to
#     alb_listener_arn).
#   - Task/execution role provisioning (RFC-0083 — this module consumes
#     the two role ARNs).
#   - Capability binding provisioning (pkg/capabilities — Dispatch's
#     binding-resolver mints the SSM/Secrets Manager entries and passes
#     their ARNs into var.bindings).

locals {
  # Naming convention across every per-App primitive. Length capped at 32
  # in the variables' validation blocks so nothing overflows AWS's tighter
  # limits (Target Group: 32; Log Group prefix: fine at any).
  name_prefix = "forge-app-${var.app_slug}"

  # Every name that must be unique across deploy envs carries the env token
  # (see local.env_token below). The bare prefix is NOT safe as a service or
  # task-family name: ECS service names are unique per CLUSTER and task
  # families per ACCOUNT, and under the shared-cluster posture (root
  # main.tf: staging AND internal_prod land on the staging cluster until
  # Forge has a real production deployment) the promote of an app that is
  # already resident in staging tries to create a second service with the
  # same name in the same cluster. Proven live 2026-08-27: greetly's promote
  # to internal_prod failed with "InvalidParameterException: Creation of
  # service was not idempotent" (talino-labs/greetly-01a04145 GHA run
  # 33048181948), staging having created `forge-app-greetly` minutes
  # earlier. The target group learned this lesson first (2026-08-19, see the
  # env_token comment); the service and family now follow the same rule, so
  # the module is correct under EITHER cluster posture.
  service_name = "${local.name_prefix}-${local.env_token}"

  # Log group namespaced by env so a slug collision across tiers cannot
  # mix logs.
  log_group_name = "/aws/ecs/${var.env}/${local.name_prefix}"

  # ECS task-def family — stable across revisions so `describe-task-def
  # --task-definition family` returns the latest without needing the
  # revision number. Env-tokened so each deploy env has its OWN revision
  # line: a shared family interleaves staging and prod revisions
  # (forge-app-greetly:1 = staging, :2 = internal_prod on 2026-08-27) and
  # "latest" stops meaning anything per env.
  task_family = local.service_name

  # Host-header the ALB rule matches on. The env subdomain (staging /
  # internal / public) is derived from env + exposure per the D-20/D-63
  # DNS layout:
  #   staging       → staging.app.<parent_zone>
  #   internal_prod → internal.app.<parent_zone>
  #   public_prod   → public.app.<parent_zone> or app.<parent_zone> (public bare)
  env_subdomain = (
    var.env == "staging" ? "staging" :
    var.env == "internal_prod" ? "internal" :
    "public"
  )

  # Short env token for names that must be BOTH account-unique and <= 32
  # chars. Target-group names are unique per account+region — NOT per ALB —
  # so a name without an env component collides the moment one app deploys
  # to a second env. Proven live 2026-08-19: server-time-app's promote
  # failed with "Target Group (tg-forge-server-time-app) already exists"
  # (GHA run 32267130640), staging having created that name minutes earlier.
  env_token = (
    var.env == "staging" ? "stg" :
    var.env == "internal_prod" ? "int" :
    "pub"
  )
  live_host = "${var.app_slug}.${local.env_subdomain}.app.${var.parent_zone}"

  # Fully-qualified image reference — digest, not tag. This is the D-65
  # promotion invariant: exactly the bytes Stage's cosign signed.
  image_ref = "${var.ecr_registry}/${var.ecr_repo}@${var.image_digest}"

  common_tags = {
    Name      = local.service_name
    Purpose   = "forge-app-runtime"
    AppID     = var.app_id
    AppSlug   = var.app_slug
    Env       = var.env
    Exposure  = var.exposure
    ReleaseID = var.release_id
    ManagedBy = "rfc-0089"
  }
}

# -----------------------------------------------------------------------------
# CloudWatch log group
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "app" {
  name              = local.log_group_name
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

# -----------------------------------------------------------------------------
# ECS task definition
# -----------------------------------------------------------------------------
#
# containerDefinitions[].secrets sources capability env from SSM Parameter
# Store / Secrets Manager by ARN — NEVER containerDefinitions[].environment
# (which stores plaintext values in the task-def, visible to anyone with
# ecs:DescribeTaskDefinition). This is the TD-0013 gate at the substrate
# level.
#
# The list is concat([web], [sidecars]) (RFC-0117). `web` is FIRST and
# unconditional: with var.sidecars empty — which is every App that declares no
# auth capability — concat yields exactly the single-element list this module
# has always rendered, byte for byte. The sidecar arm adds containers to the
# task and nothing else; it touches neither the target group, nor the listener
# rule, nor aws_ecs_service.app's load_balancer block.

resource "aws_ecs_task_definition" "app" {
  family                   = local.task_family
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.cpu)
  memory                   = tostring(var.memory)
  execution_role_arn       = var.task_exec_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode(concat([
    {
      name      = "web"
      image     = local.image_ref
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        },
      ]
      # Capability env via secret references — TD-0013 gate. `environment`
      # is deliberately EMPTY for capability values; any non-capability
      # env (e.g. FORGE_APP_SLUG for logging correlation) can go in
      # `environment` because it is not a secret.
      #
      # The builder's App Configuration `config` variables (D-198) follow
      # the four Forge entries. With var.environment empty — every App that
      # sets none — concat yields exactly the four-entry list this module
      # renders, byte for byte. A name colliding with a FORGE_* entry or a
      # binding is refused (variables.tf and the precondition below), so
      # list order never decides precedence.
      #
      # FORGE_SEED_ENV is the deploy tier (var.env) the App's seed runner
      # applies `seeds/<env>/` for, after its migrations and before it
      # listens (RFC-0180, D-246). Always set: an App without the runner, or
      # with an empty folder, ignores it, so no flag or variable gates it.
      environment = concat([
        { name = "FORGE_APP_SLUG", value = var.app_slug },
        { name = "FORGE_APP_ID", value = var.app_id },
        { name = "FORGE_RELEASE_ID", value = var.release_id },
        { name = "FORGE_SEED_ENV", value = var.env },
        ], [
        for e in var.environment : {
          name  = e.name
          value = e.value
        }
      ])
      secrets = [
        for b in var.bindings : {
          name      = b.env_name
          valueFrom = b.secret_arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
    ], [
    for s in var.sidecars : {
      name      = s.name
      image     = s.image
      essential = true
      # `essential = true` is a choice the module makes, not one the caller
      # can express: pkg/deploy.Sidecar carries no Essential field. A sidecar
      # exists because the App depends on it over loopback (the auth
      # capability's Kratos is the first), and a NON-essential container that
      # dies simply stays dead for the life of the task — ECS does not
      # restart individual containers — leaving the App up and serving with a
      # broken dependency and nothing to notice. Essential makes that failure
      # loud and self-healing: the task is replaced.
      #
      # There is deliberately NO portMappings key here, and the absence IS
      # the enforcement (R-15). awsvpc already gives every container in the
      # task loopback reachability with no mapping declared, so a sidecar
      # needs none in order to work — and with none declared there is nothing
      # for a target group to be pointed at later. This is one of three
      # things keeping a sidecar task-internal; the other two are the
      # reserved "web" name (rejected by the sidecars variable's validation)
      # and aws_ecs_service.app's load_balancer { container_name = "web" }.
      #
      # `environment` is plaintext and `secrets` is ARN-referenced, the same
      # TD-0013 split the web container above draws. env_name / secret_arn is
      # the tfvars spelling (matching var.bindings); the mapping onto ECS's
      # name / valueFrom happens right here and nowhere else.
      environment = [
        for e in s.environment : {
          name  = e.name
          value = e.value
        }
      ]
      secrets = [
        for b in s.secrets : {
          name      = b.env_name
          valueFrom = b.secret_arn
        }
      ]
      # Identical to the web container's logConfiguration on purpose:
      # sidecars ride the App task's existing log group, no new lane. The
      # awslogs driver already namespaces per container — the stream is
      # <prefix>/<container-name>/<task-id> — so the shared "ecs" prefix
      # yields ecs/<sidecar-name>/<task-id> and sidecar output never
      # interleaves with the App's own.
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ]))

  tags = local.common_tags

  # D-198: a builder's plaintext variable may not share a name with a binding
  # (a capability's, or one of their own secrets'). The two lists would both
  # define the name inside the `web` container, and ECS does not promise which
  # wins. Dispatch never sends such a pair; this is the module-side refusal for
  # a hand-dispatched spec. A precondition rather than a variable validation so
  # it does not depend on cross-variable references in validation blocks.
  lifecycle {
    precondition {
      condition = length(setintersection(
        toset([for e in var.environment : e.name]),
        toset([for b in var.bindings : b.env_name]),
      )) == 0
      error_message = "environment[] and bindings[] share a name. A builder's App Configuration variable must not override a capability's or a secret's variable (D-198: capability and Forge-provided variables win; Dispatch drops the builder's copy before dispatch)."
    }
  }
}

data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# ALB target group + listener rule
# -----------------------------------------------------------------------------
#
# Target group is created here so its ARN can be passed to the service's
# load_balancers block. The rule attaches to the RFC-0083-provided listener
# (staging / internal / public) with a host-header match on live_host.

resource "aws_lb_target_group" "app" {
  # Target Group names are capped at 32 characters by AWS and are unique per
  # account+region — NOT per ALB. Layout (RFC-0102 C-15 fix):
  #
  #   substr("tg-forge-<slug>", 0, 23)  -> at most 23 chars
  #   + "-" + substr(sha256(slug), 0, 4) -> 5 chars (hash of the FULL slug)
  #   + "-" + env_token (3 chars)        -> 4 chars
  #   = at most 32 chars for every env token (stg | int | pub).
  #
  # The 4-hex-char hash of the FULL slug keeps two Apps distinct even when
  # their truncated prefixes collide (pre-C-15, two slugs sharing the first
  # 19 slug chars collided account-wide); the env token keeps the same App's
  # envs distinct (see local.env_token). The name stays deterministic and
  # stable per (app_slug, env) across re-applies.
  #
  # NOTE: adding the hash changed the name from the pre-C-15 layout, so an
  # App deployed under the old name gets its Target Group REPLACED on its
  # next apply (TG names are immutable -> destroy/create). Acceptable at the
  # current stage: dev-tier Apps are torn down and redeployed freely.
  name        = "${substr("tg-forge-${var.app_slug}", 0, 23)}-${substr(sha256(var.app_slug), 0, 4)}-${local.env_token}"
  port        = var.container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    path                = "/"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200-399"
  }

  # Deregistration delay short enough that a rolling deploy doesn't leave
  # old tasks draining for minutes.
  deregistration_delay = 30

  tags = local.common_tags
}

resource "aws_lb_listener_rule" "app" {
  listener_arn = var.alb_listener_arn

  # Deterministic priority derived from the App's identity (RFC-0102 C-14).
  # Without an explicit priority the provider asks ELBv2 for the next free
  # slot at apply time — a read-then-write that RACES when two Apps apply
  # concurrently against the same shared listener (every App in a deploy env
  # shares that env's ALB listener): the loser fails with PriorityInUse.
  # Hashing app_slug+env instead makes the priority stable across re-applies
  # — idempotent per (App, env), which the per-(App, env) remote-state
  # layout requires — and needs no coordination between concurrent applies.
  # Range: 1000..47999, inside ELBv2's 1..50000 bounds and wide enough that
  # a hash collision between two Apps is rare; if one does occur it surfaces
  # as PriorityInUse at apply time, and the escape hatch is re-slugging the
  # App and rerunning. Scaling ceiling: the ELBv2 default quota is 100 rules
  # per listener, so ~100 Apps per deploy env before a quota bump is needed
  # (see README.md, Scaling notes).
  priority = (parseint(substr(sha256("${var.app_slug}-${var.env}"), 0, 4), 16) % 47000) + 1000

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  condition {
    host_header {
      values = [local.live_host]
    }
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ECS service (rolling deploy, circuit-breaker rollback, health-check grace)
# -----------------------------------------------------------------------------

resource "aws_ecs_service" "app" {
  name            = local.service_name
  cluster         = var.cluster_arn
  task_definition = aws_ecs_task_definition.app.arn
  launch_type     = "FARGATE"
  desired_count   = var.desired_count

  # Rolling deploy — one old task drains as one new task starts (deregistration
  # delay above bounds the drain window).
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  # A new task set that never turns healthy (forge-server exits non-zero
  # when a startup migration fails, so the port never opens) trips the
  # circuit breaker: ECS rolls back to the previous task set, and because
  # apply waits for steady state, `tofu apply` fails with it.
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  wait_for_steady_state = true

  # Grace period for the app to start responding to health checks. 180s
  # covers forge-server applying the App's pending migrations before it
  # listens — a first deploy may apply many.
  health_check_grace_period_seconds = 180

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "web"
    container_port   = var.container_port
  }

  # The listener rule must exist before the service tries to register
  # targets, otherwise the ALB has nowhere to send traffic during the
  # brief first-registration window.
  depends_on = [aws_lb_listener_rule.app]

  # Explicit ignore of task_definition drift so an out-of-band task-def
  # register (should not happen — Dispatch is the sole writer) does not
  # bounce the service on the next apply. Every apply that changes the
  # digest bumps the aws_ecs_task_definition.app.arn value, which
  # propagates cleanly.
  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = local.common_tags
}
