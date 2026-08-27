locals {
  env  = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
  name = "${var.project}-${terraform.workspace}"

  okta_saml_ready = local.env.grafana_okta_saml_metadata_url != "" && length(local.env.grafana_admin_okta_groups) > 0 && length(local.env.grafana_editor_okta_groups) > 0

  # Delivery only. Off in dev, where nobody acts on a page.
  alerts_enabled = local.env.alerts_enabled

  saturation_threshold = 0.8

  # absent() defers by lookback_delta, so a 5m `for` really pages at ~10m.
  metrics_absent_for = "5m"

  # Absolute: Slack renders a bare path as plain text rather than a link.
  dashboard_url = "https://${aws_grafana_workspace.this.endpoint}/d/be-overview"

  # YACE exports Sum-stat metrics as an instantaneous gauge of the last 60s
  # window, so rate() is invalid and per-second is `value / 60`. CloudWatch
  # publishes several dimension rollups per metric and YACE exports each as its
  # own series, hence the dimension filters.
  recording_rules_yaml = <<-YAML
    groups:
      - name: ${local.name}-recording
        interval: 60s
        rules:
          - record: amp:alb_5xx:per_second
            expr: aws_applicationelb_httpcode_target_5_xx_count_sum{dimension_TargetGroup!=""} / 60
          - record: amp:alb_requests:per_second
            expr: aws_applicationelb_request_count_sum{dimension_TargetGroup!=""} / 60
          # Kept per-rule. WAF also publishes a Rule="ALL" aggregate, which is
          # why the alert below takes max() rather than sum().
          - record: amp:waf_blocked:per_second
            expr: aws_wafv2_blocked_requests_sum{dimension_WebACL!=""} / 60
          - record: amp:app_5xx:per_second
            expr: sum(rate(block_explorer_http_responses_total{source="app-frontend", status=~"5.."}[5m]))
          # Everything that is neither a success nor a not_found, so a new
          # outcome value is alerted on the day it is added. not_found is
          # expected traffic — a block or address that does not exist.
          - record: amp:upstream_errors:per_second
            expr: sum(rate(block_explorer_upstream_requests_total{source="app-frontend", outcome!~"ok|not_found"}[5m]))
          - record: amp:cache_hits:ratio5m
            expr: sum(rate(block_explorer_cache_requests_total{source="app-frontend", result="hit"}[5m])) / sum(rate(block_explorer_cache_requests_total{source="app-frontend"}[5m]))
  YAML

  # env is stamped explicitly on every rule: recording-rule and alerting-rule
  # output drops the collector's external_labels block.
  alert_rules_yaml = <<-YAML
    groups:
      - name: ${local.name}-alerts
        rules:
          - alert: HighALB5xxRate
            expr: sum(amp:alb_5xx:per_second) > 1
            for: 5m
            labels:
              severity: warning
              env: ${terraform.workspace}
            annotations:
              title: "High ALB 5xx rate"
              summary: "The target group has been returning more than 1 5xx per second for over 5 minutes."
              dashboard_url: "${local.dashboard_url}?viewPanel=3"

          # Counted at the app, so it survives a target group that has stopped
          # publishing and separates app faults from load-balancer faults.
          - alert: HighAppErrorRate
            expr: amp:app_5xx:per_second > 1
            for: 5m
            labels:
              severity: warning
              env: ${terraform.workspace}
            annotations:
              title: "High app 5xx rate"
              summary: "The explorer has been returning more than 1 5xx per second for over 5 minutes."
              dashboard_url: "${local.dashboard_url}?viewPanel=24"

          # Every page is server-rendered per request, so a failing Thor node or
          # indexer surfaces as a broken site rather than a stale one.
          - alert: UpstreamErrorRateHigh
            expr: amp:upstream_errors:per_second > 1
            for: 10m
            labels:
              severity: warning
              env: ${terraform.workspace}
            annotations:
              title: "Upstream errors are high"
              summary: "The cached proxy has been failing more than 1 upstream fetch per second for over 10 minutes — check the Thor nodes and the VeWorld indexer."
              dashboard_url: "${local.dashboard_url}?viewPanel=22"

          # A rolling deploy drops running below desired for a minute or two,
          # which the 10m window skips. Past that the deploy is stuck or Fargate
          # cannot place the task.
          - alert: EcsTaskDrift
            expr: (aws_ecs_containerinsights_desired_task_count_average{dimension_ServiceName!=""} - on(dimension_ClusterName, dimension_ServiceName) aws_ecs_containerinsights_running_task_count_average{dimension_ServiceName!=""}) > 0
            for: 10m
            labels:
              severity: warning
              env: ${terraform.workspace}
            annotations:
              title: "ECS task drift"
              summary: "An ECS service has been running fewer tasks than desired for over 10 minutes (stuck deploy or capacity shortfall)."
              dashboard_url: "${local.dashboard_url}?viewPanel=12"

          # Per-task, not aggregated: one saturated task pages even while its
          # siblings idle.
          - alert: EcsTaskCpuHigh
            expr: (ecs_task_cpu_utilized_None{source="ecs-sidecar"} / ecs_task_cpu_reserved_None{source="ecs-sidecar"}) > ${local.saturation_threshold}
            for: 10m
            labels:
              severity: warning
              env: ${terraform.workspace}
            annotations:
              title: "High CPU usage"
              summary: "A task has been above ${format("%.0f", local.saturation_threshold * 100)}% of its reserved CPU for over 10 minutes."
              dashboard_url: "${local.dashboard_url}?viewPanel=10"
              ecs_url: "https://${var.aws_region}.console.aws.amazon.com/ecs/v2/clusters/${local.name}-cluster/services/${local.name}-{{ $labels.service }}/tasks/{{ $labels.aws_ecs_task_id }}/configuration"

          - alert: EcsTaskMemoryHigh
            expr: (ecs_task_memory_utilized_Megabytes{source="ecs-sidecar"} / ecs_task_memory_reserved_Megabytes{source="ecs-sidecar"}) > ${local.saturation_threshold}
            for: 10m
            labels:
              severity: warning
              env: ${terraform.workspace}
            annotations:
              title: "High memory usage"
              summary: "A task has been above ${format("%.0f", local.saturation_threshold * 100)}% of its reserved memory for over 10 minutes."
              dashboard_url: "${local.dashboard_url}?viewPanel=11"
              ecs_url: "https://${var.aws_region}.console.aws.amazon.com/ecs/v2/clusters/${local.name}-cluster/services/${local.name}-{{ $labels.service }}/tasks/{{ $labels.aws_ecs_task_id }}/configuration"

          # Reads either way round: a real flood, or a managed rule group
          # false-positiving on legitimate traffic after it is flipped to block.
          - alert: WafBlockSpike
            expr: max(amp:waf_blocked:per_second) > 5
            for: 10m
            labels:
              severity: warning
              env: ${terraform.workspace}
            annotations:
              title: "WAF is blocking heavily"
              summary: "A WAF rule has been blocking more than 5 requests per second for over 10 minutes. Check the WAF log group for whether the source is hostile or a false positive."
              dashboard_url: "${local.dashboard_url}?viewPanel=31"

          # Pipeline liveness: a threshold rule goes quiet when its series stop
          # arriving, so absent() is what notices the gap. ANDed across two
          # namespaces so one throttled GetMetricData call cannot trip it.
          - alert: CloudWatchMetricsAbsent
            expr: absent(aws_applicationelb_request_count_sum) and absent(aws_ecs_containerinsights_running_task_count_average)
            for: ${local.metrics_absent_for}
            labels:
              severity: critical
              env: ${terraform.workspace}
            annotations:
              title: "No CloudWatch metrics reaching AMP"
              summary: "Every YACE-sourced series has stopped arriving — the observability-collector task is down or cannot reach the CloudWatch API. The ALB, WAF and task-drift rules are blind until it returns."
              dashboard_url: "${local.dashboard_url}"

          # A default metric, so it exists from process start rather than from
          # first traffic.
          - alert: AppMetricsAbsent
            expr: absent(process_cpu_seconds_total{source="app-frontend"})
            for: ${local.metrics_absent_for}
            labels:
              severity: critical
              env: ${terraform.workspace}
            annotations:
              title: "No metrics reaching AMP from the explorer"
              summary: "The /api/metrics scrape has stopped producing series — the service is down, its sidecar is not scraping, or remote-write is failing. Every cache, upstream and app-error rule is blind until it returns."
              dashboard_url: "${local.dashboard_url}?viewPanel=20"

          # Fleet-wide: one task losing its sidecar is invisible here.
          - alert: EcsSidecarMetricsAbsent
            expr: absent(ecs_task_cpu_utilized_None{source="ecs-sidecar"})
            for: ${local.metrics_absent_for}
            labels:
              severity: critical
              env: ${terraform.workspace}
            annotations:
              title: "No per-task metrics reaching AMP"
              summary: "Per-task cgroup series have stopped arriving from every sidecar in the fleet — the CPU and memory rules are blind until they return."
              dashboard_url: "${local.dashboard_url}?viewPanel=10"
  YAML

  # AMP's sns_configs defaults to upstream Alertmanager's plain-text body, so
  # sns.default.message is overridden to render the Slack post here. The bridge
  # Lambda forwards SNS.Message verbatim.
  alertmanager_definition = <<-YAML
    template_files:
      default.tmpl: |
        {{ define "sns.default.message" -}}
        *[{{ .CommonLabels.env }}] {{ if .CommonAnnotations.title }}{{ .CommonAnnotations.title }}{{ else }}{{ .CommonLabels.alertname }}{{ end }}*{{ if eq .Status "resolved" }} — resolved{{ else }}{{ if or (gt (len .Alerts.Firing) 1) (gt (len .Alerts.Resolved) 0) }} — {{ len .Alerts.Firing }} firing{{ if gt (len .Alerts.Resolved) 0 }}, {{ len .Alerts.Resolved }} recovered{{ end }}{{ end }}
        {{ .CommonAnnotations.summary }} <{{ .CommonAnnotations.dashboard_url }}|View on Grafana>{{ if (index .Alerts.Firing 0).Labels.service }}
        Affected: {{ range $i, $a := .Alerts.Firing }}{{ if $i }}, {{ end }}<{{ $a.Annotations.ecs_url }}|{{ $a.Labels.service }} ({{ printf "%.8s" $a.Labels.aws_ecs_task_id }})>{{ end }}{{ end }}{{ end }}
        {{- end }}
    alertmanager_config: |
      templates:
        - default.tmpl
      route:
        receiver: 'slack-sns'
        group_by: ['alertname', 'env']
        group_wait: 30s
        group_interval: 5m
        repeat_interval: 4h
      receivers:
        - name: 'slack-sns'
          sns_configs:
            - topic_arn: '${aws_sns_topic.alerts.arn}'
              sigv4:
                region: '${var.aws_region}'
  YAML
}
