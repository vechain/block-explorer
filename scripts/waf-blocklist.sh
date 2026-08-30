#!/usr/bin/env bash
# Edits the edge WAF IP set that Terraform creates but does not populate.
# Changes take effect within seconds; no deploy, no apply.
#
#   scripts/waf-blocklist.sh list   prod
#   scripts/waf-blocklist.sh add    prod 144.76.0.0/16
#   scripts/waf-blocklist.sh remove prod 144.76.0.0/16
set -euo pipefail

REGION="${AWS_REGION:-eu-west-1}"

usage() {
  echo "usage: $0 {list|add|remove} {dev|prod} [cidr]" >&2
  exit 2
}

[ $# -ge 2 ] || usage
action="$1"
env="$2"
cidr="${3:-}"

case "$env" in
  dev | prod) ;;
  *) usage ;;
esac

# Reads work with the -read profile; add/remove need write, hence -admin.
profile="explorer-${env}-read"
[ "$action" = "list" ] || profile="explorer-${env}-admin"
name="block-explorer-${env}-waf-blocklist"

aws_wafv2() { aws --profile "$profile" --region "$REGION" wafv2 "$@"; }

id=$(aws_wafv2 list-ip-sets --scope REGIONAL \
  --query "IPSets[?Name=='${name}'].Id | [0]" --output text)
if [ -z "$id" ] || [ "$id" = "None" ]; then
  echo "No IP set named ${name} in ${REGION}. Has terraform/edge been applied?" >&2
  exit 1
fi

read -r lock current < <(
  aws_wafv2 get-ip-set --scope REGIONAL --name "$name" --id "$id" \
    --query "[LockToken, join(',', IPSet.Addresses)]" --output text
)
[ "$current" = "None" ] && current=""

case "$action" in
  list)
    if [ -z "$current" ]; then echo "(empty)"; else tr ',' '\n' <<<"$current"; fi
    exit 0
    ;;
  add | remove) [ -n "$cidr" ] || usage ;;
  *) usage ;;
esac

# update-ip-set replaces the set wholesale, so rebuild the whole list.
addresses=$(ACTION="$action" CURRENT="$current" CIDR="$cidr" python3 -c '
import json, os, sys

current = [a for a in os.environ["CURRENT"].split(",") if a]
cidr, action = os.environ["CIDR"], os.environ["ACTION"]

if action == "add":
    if cidr in current:
        print(f"{cidr} is already in the set; nothing to do.", file=sys.stderr)
        sys.exit(3)
    current.append(cidr)
else:
    if cidr not in current:
        print(f"{cidr} is not in the set; nothing to do.", file=sys.stderr)
        sys.exit(3)
    current.remove(cidr)

print(json.dumps(current))
') || { [ $? -eq 3 ] && exit 0 || exit 1; }

aws_wafv2 update-ip-set --scope REGIONAL --name "$name" --id "$id" \
  --lock-token "$lock" --addresses "$addresses" >/dev/null

echo "${name} now holds:"
python3 -c 'import json,sys; a=json.loads(sys.argv[1]); print("\n".join("  "+x for x in a) or "  (empty)")' "$addresses"
