# Access logs and the additional CloudWatch metrics, both of which CloudFront only offers from
# us-east-1. Standard logging v2 rather than the legacy config: it delivers to a bucket with ACLs
# disabled, and delivery to S3 carries no charge beyond the storage.

resource "aws_s3_bucket" "logs" {
  bucket = "${local.name}-cdn-logs-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Nothing prunes these on its own, and a full day is several GB at prod volume.
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire"
    status = "Enabled"

    filter {}

    expiration {
      days = local.env.log_retention_days
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

data "aws_iam_policy_document" "logs" {
  statement {
    sid       = "AllowLogDeliveryWrite"
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.logs.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }

    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:delivery-source:*"]
    }
  }

  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.logs.arn, "${aws_s3_bucket.logs.arn}/*"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id
  policy = data.aws_iam_policy_document.logs.json
}

resource "aws_cloudwatch_log_delivery_source" "access_logs" {
  provider = aws.us_east_1

  name         = "${local.name}-cdn-access-logs"
  resource_arn = aws_cloudfront_distribution.main.arn
  log_type     = "ACCESS_LOGS"
}

# Partitioned by date so an Athena query over one day scans one day. w3c rather than parquet:
# the conversion is the one part of this delivery path CloudWatch bills for.
resource "aws_cloudwatch_log_delivery_destination" "access_logs" {
  provider = aws.us_east_1

  name          = "${local.name}-cdn-access-logs"
  output_format = "w3c"

  delivery_destination_configuration {
    destination_resource_arn = aws_s3_bucket.logs.arn
  }
}

resource "aws_cloudwatch_log_delivery" "access_logs" {
  provider = aws.us_east_1

  delivery_source_name     = aws_cloudwatch_log_delivery_source.access_logs.name
  delivery_destination_arn = aws_cloudwatch_log_delivery_destination.access_logs.arn

  s3_delivery_configuration {
    suffix_path                 = "{DistributionId}/{yyyy}/{MM}/{dd}"
    enable_hive_compatible_path = true
  }

  depends_on = [aws_s3_bucket_policy.logs]
}

# Cache hit rate and origin latency are not published without this, and both are what the
# dashboard and the alarms read. Eight metrics at a flat monthly rate each.
resource "aws_cloudfront_monitoring_subscription" "main" {
  distribution_id = aws_cloudfront_distribution.main.id

  monitoring_subscription {
    realtime_metrics_subscription_config {
      realtime_metrics_subscription_status = "Enabled"
    }
  }
}
