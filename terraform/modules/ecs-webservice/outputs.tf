output "service_name" {
  description = "ECS service name. What `aws ecs update-service --service` takes."
  value       = one(concat(aws_ecs_service.this[*].name, aws_ecs_service.rolling[*].name))
}

output "task_definition_family" {
  description = "Task definition family. Pass it to `aws ecs update-service --task-definition` so a forced deployment picks up the newest revision rather than the frozen one the service still points at."
  value       = aws_ecs_task_definition.this.family
}

output "task_definition_arn" {
  description = "ARN of the revision this apply registered."
  value       = aws_ecs_task_definition.this.arn
}

output "execution_role_arn" {
  description = "Task execution role ARN."
  value       = aws_iam_role.execution.arn
}

output "task_role_arn" {
  description = "Task role ARN. Empty of permissions unless task_role_policy_json was passed."
  value       = aws_iam_role.task.arn
}

output "task_role_name" {
  description = "Task role name, for attaching further policies from the calling stack."
  value       = aws_iam_role.task.name
}

output "log_group_name" {
  description = "CloudWatch log group for the service, shared by the app container and any sidecar."
  value       = aws_cloudwatch_log_group.this.name
}
