#!/bin/bash
# Quick test to verify Claude Code CLI integration works.
# Run this OUTSIDE of a Claude Code session.
# Usage: bash .github/scripts/test-claude-code-integration.sh

set -e

echo "=== Testing Claude Code CLI integration ==="

# 1. Verify claude CLI is available
if ! command -v claude &> /dev/null; then
    echo "❌ claude CLI not found. Install Claude Code first."
    exit 1
fi
echo "✅ claude CLI found: $(which claude)"

# 2. Test JSON output format with minimal context
echo ""
echo "--- Testing --output-format json (minimal context) ---"
RESULT=$(claude -p "Reply with exactly: enhanced-summary-test" \
    --output-format json \
    --model sonnet \
    --max-turns 1 \
    --no-chrome \
    --disallowedTools '*' \
    2>/dev/null)

# 3. Extract from the array format: find the assistant message
EXTRACTED=$(echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data:
    if item.get('type') == 'assistant':
        text = item['message']['content'][0]['text']
        print(text)
        sys.exit(0)
print('NO_ASSISTANT_MSG')
" 2>/dev/null || echo "PARSE_FAILED")

echo "Extracted text: $EXTRACTED"

# 4. Check cost
COST=$(echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data:
    if item.get('type') == 'result':
        print(f\"Cost: \${item.get('total_cost_usd', 'unknown')}\")
        sys.exit(0)
" 2>/dev/null || echo "unknown")
echo "$COST"

if [ "$EXTRACTED" = "NO_ASSISTANT_MSG" ] || [ "$EXTRACTED" = "PARSE_FAILED" ]; then
    echo "❌ Could not extract result from Claude Code output"
    exit 1
fi

echo "✅ Claude Code CLI integration working correctly"

# 5. Optionally test the full enhancer
if [ "${1}" = "--full" ]; then
    echo ""
    echo "--- Testing full enhancer with Claude Code backend ---"
    cd "$(dirname "$0")"
    unset ANTHROPIC_API_KEY
    USE_CLAUDE_CODE=true ACTIVITY_SCORE=100 node claude-enhancer.js 2>&1
fi

echo ""
echo "=== Done ==="
