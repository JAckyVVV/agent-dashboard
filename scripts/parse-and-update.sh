#!/bin/bash
# parse-and-update-dashboard.sh
# This script parses agent output and triggers dashboard updates

# Extract dashboard_update JSON from stdin
DASHBOARD_DATA=$(cat | grep -o '\{[[[:space:]]*"dashboard_update"[^{}]*\}' | head -1)

if [ -z "$DASHBOARD_DATA" ]; then
    echo "No dashboard_update data found in input"
    exit 0
fi

echo "Found dashboard update data: $DASHBOARD_DATA"

# Parse the data
AGENT=$(echo "$DASHBOARD_DATA" | jq -r '.dashboard_update.agent // "Agent"')
TITLE=$(echo "$DASHBOARD_DATA" | jq -r '.dashboard_update.title // "Update"')
SUMMARY=$(echo "$DASHBOARD_DATA" | jq -r '.dashboard_update.summary // ""')

# Create the report JSON
REPORT_JSON=$(jq -n \
  --arg title "$TITLE" \
  --arg summary "$SUMMARY" \
  '{title: $title, summary: $summary}')

echo "Triggering update for: $AGENT"
echo "Report: $REPORT_JSON"

# Trigger the GitHub workflow (requires AGENT_TOKEN env var)
if [ -n "$AGENT_TOKEN" ]; then
    curl -X POST \
      -H "Authorization: token $AGENT_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      -H "Content-Type: application/json" \
      "https://api.github.com/repos/jackyvvv/agent-dashboard/actions/workflows/update.yml/dispatches" \
      -d "{
        \"ref\": \"main\",
        \"inputs\": {
          \"agent_name\": \"$AGENT\",
          \"report_data\": $(echo "$REPORT_JSON" | jq -Rs '.[:-1]')
        }
      }"
    echo "Dashboard update triggered successfully!"
else
    echo "Warning: AGENT_TOKEN not set. Dashboard not updated."
    echo "Set it with: export AGENT_TOKEN=ghp_xxxxxxxx"
fi
