"""SNS to Slack bridge for CloudWatch alarms.

Alarm JSON is rendered here from the "Title — summary." shape every alarm
description carries. Anything else on the topic is forwarded verbatim.
"""

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

import boto3
from botocore.exceptions import ClientError

_secrets_client = boto3.client("secretsmanager")
_webhook_cache: dict[str, float | str | None] = {"url": None, "fetched_at": 0.0}
_CACHE_TTL_SECONDS = 300
_PLACEHOLDER_SENTINEL = "placeholder"


def _resolve_webhook_url() -> str | None:
    # Placeholder results are cached too, so an unset webhook does not hammer
    # Secrets Manager. On a transient read error the last cached value is reused:
    # delivering an alert matters more than catching a just-rotated URL.
    now = time.time()
    fetched_at = float(_webhook_cache.get("fetched_at") or 0.0)
    if fetched_at > 0.0 and now - fetched_at < _CACHE_TTL_SECONDS:
        cached = _webhook_cache.get("url")
        return str(cached) if cached else None

    secret_arn = os.environ["SLACK_WEBHOOK_SECRET_ARN"]
    try:
        resp = _secrets_client.get_secret_value(SecretId=secret_arn)
    except ClientError as exc:
        if fetched_at > 0.0:
            cached = _webhook_cache.get("url")
            print(f"slack webhook secret read failed; using cached value: {exc}")
            return str(cached) if cached else None
        # No cached value to fall back on. Returning None would ack the SNS
        # invocation and drop the alert for good, so fail and let SNS retry.
        print(f"slack webhook secret read failed with no cached value: {exc}")
        raise

    value = (resp.get("SecretString") or "").strip()
    url: str | None = value if (value and value != _PLACEHOLDER_SENTINEL) else None
    _webhook_cache["url"] = url
    _webhook_cache["fetched_at"] = now
    return url


_STATE_SUFFIX = {"OK": " — resolved", "INSUFFICIENT_DATA": " — insufficient data"}


def _render_cloudwatch_alarm(message: str) -> str | None:
    """Render a CloudWatch alarm into a Slack post, or None if it isn't one.

    Alarm descriptions are written "Title — summary." so the halves land as a
    bold header and a body line.
    """
    try:
        payload = json.loads(message)
    except (ValueError, TypeError):
        return None
    if not isinstance(payload, dict) or "AlarmName" not in payload:
        return None

    name = payload["AlarmName"]
    description = (payload.get("AlarmDescription") or name).strip()
    title, _, summary = description.partition(" — ")

    header = f"*[{os.environ.get('ALERT_ENV', '')}] {title.strip()}*"
    header += _STATE_SUFFIX.get(payload.get("NewStateValue", ""), "")

    arn_parts = str(payload.get("AlarmArn", "")).split(":")
    region = arn_parts[3] if len(arn_parts) > 3 else os.environ.get("AWS_REGION", "")
    link = (
        f"<https://{region}.console.aws.amazon.com/cloudwatch/home?region={region}"
        f"#alarmsV2:alarm/{urllib.parse.quote(name, safe='')}|View in CloudWatch>"
    )

    return f"{header}\n{summary.strip()} {link}".rstrip() if summary.strip() else f"{header}\n{link}"


def _post_to_slack(webhook_url: str, text: str) -> None:
    # Failures re-raise so SNS retries with backoff: a duplicate Slack message
    # beats a dropped alert.
    body = json.dumps({"text": text}).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=5).close()
    except urllib.error.HTTPError as exc:
        print(f"slack POST returned {exc.code}: {exc.read().decode('utf-8', 'replace')}")
        raise
    except urllib.error.URLError as exc:
        print(f"slack POST failed: {exc}")
        raise


def handler(event: dict, _context) -> None:
    webhook_url = _resolve_webhook_url()
    if not webhook_url:
        print("slack webhook URL not configured (placeholder); skipping delivery")
        return

    for record in event.get("Records", []):
        text = (record.get("Sns") or {}).get("Message", "").strip()
        if not text:
            print("SNS record missing Message; skipping")
            continue
        _post_to_slack(webhook_url, _render_cloudwatch_alarm(text) or text)
