# Forge apps/modules/ecs — outputs.
#
# The Go adapter (pkg/deploy/ecs) reads `live_url` post-apply to populate
# deploy.Result.LiveURL. Other outputs are for operator diagnosis and for
# the reclaim reconciler that eventually calls Destroy.

output "live_url" {
  description = "The URL the deployed App is reachable on. Absolute URL with scheme — matches the deploy.Result.LiveURL contract."
  value       = "https://${local.live_host}"
}

output "task_definition_arn" {
  description = "The registered task-definition ARN. Useful for correlating the ECS deploy event with the release row."
  value       = aws_ecs_task_definition.app.arn
}

output "service_arn" {
  description = "The ECS service ARN."
  value       = aws_ecs_service.app.id
}

output "target_group_arn" {
  description = "ALB target group ARN. Used by the reclaim reconciler when tearing down."
  value       = aws_lb_target_group.app.arn
}

output "log_group_name" {
  description = "CloudWatch log group name — surfaced so operators can jump straight to the App's logs from a release row."
  value       = aws_cloudwatch_log_group.app.name
}

output "image_ref" {
  description = "The digest-pinned image reference the task-def is running."
  value       = local.image_ref
}
