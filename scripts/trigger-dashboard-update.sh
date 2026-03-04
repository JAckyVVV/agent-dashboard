#!/bin/bash
# trigger-dashboard-update.sh
# Call this script to update the GitHub dashboard
# Usage: ./trigger-dashboard-update.sh "Agent Name" '{"title":"...","summary":"..."}'

AGENT_NAME="${1:-Agent}"
REPORT_DATA="${2:-{}}"
REPO_OWNER="${3:-YOUR_GITHUB_USERNAME}"
REPO_NAME="${4:-agent-dashboard}"
WORKFLOW_FILE="${5:-update.yml}"

# Check if token is available
if [ -z "$AGENT_TOKEN" ]; then
    echo "Error: AGENT_TOKEN environment variable not set"
    echo "Set it with: export AGENT_TOKEN=ghp_xxxxxxxx"
    exit 1
fi

# Trigger the workflow
curl -X POST \
  -H "Authorization: token $AGENT_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE/dispatches" \
  -d "{
    \"ref\": \"main\",
    \"inputs\": {
      \"agent_name\": \"$AGENT_NAME\",
      \"report_data\": $(echo "$REPORT_DATA" | jq -Rs '.[:-1]')
    }
  }"

echo "Dashboard update triggered for: $AGENT_NAME"
