# CI/CD Cost Management Runbook

**Version**: 1.0
**Last Updated**: September 2, 2025
**Owner**: Engineering Team

## 📋 Table of Contents
1. [Quick Reference](#quick-reference)
2. [Daily Operations](#daily-operations)
3. [Emergency Procedures](#emergency-procedures)
4. [Workflow Management](#workflow-management)
5. [Cost Optimization](#cost-optimization)
6. [Troubleshooting](#troubleshooting)

## Quick Reference

### Critical Commands
```bash
# Check current usage
gh api /users/adrianwedd/settings/billing/actions | jq '.minutes_used_breakdown.UBUNTU'

# List running workflows
gh run list --status in_progress

# Cancel all running workflows
gh run list --status in_progress --json databaseId | jq '.[].databaseId' | xargs -I {} gh run cancel {}

# Disable all scheduled workflows
for file in .github/workflows/*.yml; do
  sed -i.bak '1s/^/# DISABLED\n/' "$file"
done

# Re-enable specific workflow
sed -i '1d' .github/workflows/cv-enhancement.yml
```

### Budget Thresholds
| Usage | Action | Severity |
|-------|--------|----------|
| <50% | Normal operations | ✅ Green |
| 50-75% | Monitor closely | ⚠️ Yellow |
| 75-90% | Reduce frequency | 🔶 Orange |
| 90-95% | Critical only | 🔴 Red |
| >95% | Emergency shutdown | 🚨 Critical |

## Daily Operations

### Morning Check (9 AM)
1. **Review Cost Monitor Output**
   ```bash
   gh run view --workflow=cost-monitor.yml --status=completed --limit=1
   ```

2. **Check Failed Workflows**
   ```bash
   gh run list --status=failure --limit=10
   ```

3. **Verify Critical Workflows**
   - ✅ CV Enhancement ran overnight
   - ✅ Security scan (if Monday)
   - ✅ No budget alerts

### End of Day (5 PM)
1. **Review Daily Usage**
   ```bash
   gh api /users/adrianwedd/settings/billing/actions | \
     jq '.minutes_used_breakdown.UBUNTU'
   ```

2. **Project Tomorrow's Usage**
   - Scheduled runs: Check `.github/workflows/*.yml` cron schedules
   - Expected PRs: Review open PRs that will trigger tests

## Emergency Procedures

### 🔴 Budget Exceeded (>95%)

**IMMEDIATE ACTIONS**:
1. **Stop All Non-Critical Workflows**
   ```bash
   # Cancel running workflows
   gh run list --status in_progress --json databaseId | \
     jq '.[].databaseId' | xargs -I {} gh run cancel {}

   # Disable schedules
   ./scripts/disable-scheduled-workflows.sh
   ```

2. **Keep Only Security Scanning**
   ```bash
   # Re-enable only critical
   sed -i '1d' .github/workflows/security-scanning.yml
   sed -i '1d' .github/workflows/cost-monitor.yml
   ```

3. **Notify Team**
   ```bash
   gh issue create --title "🚨 CI/CD Budget Critical" \
     --body "Budget exceeded 95%. Emergency procedures activated." \
     --label "P0: Critical,infrastructure"
   ```

### 🔶 High Usage (75-90%)

1. **Reduce Workflow Frequency**
   ```yaml
   # Change daily to weekly
   schedule:
     - cron: '0 2 * * 1'  # Monday only
   ```

2. **Disable Matrix Builds**
   ```yaml
   strategy:
     matrix:
       node: [20]  # Single version only
   ```

3. **Add Conditional Execution**
   ```yaml
   - name: Check for changes
     run: |
       if git diff --quiet HEAD~1 HEAD -- src/; then
         echo "No source changes, skipping"
         exit 0
       fi
   ```

## Workflow Management

### Enable/Disable Workflows

**Disable Specific Workflow**:
```bash
# Add disable flag
echo "# DISABLED_FOR_BUDGET" > temp.txt
cat .github/workflows/workflow-name.yml >> temp.txt
mv temp.txt .github/workflows/workflow-name.yml
```

**Re-enable Workflow**:
```bash
# Remove disable flag
sed -i '/^# DISABLED_FOR_BUDGET$/d' .github/workflows/workflow-name.yml
```

**Batch Operations**:
```bash
# Disable all except critical
CRITICAL="security-scanning.yml cost-monitor.yml"
for file in .github/workflows/*.yml; do
  name=$(basename $file)
  if [[ ! " $CRITICAL " =~ " $name " ]]; then
    echo "# DISABLED_FOR_BUDGET" > temp.txt
    cat $file >> temp.txt
    mv temp.txt $file
  fi
done
```

### Schedule Management

**Current Schedule Summary**:
| Workflow | Schedule | Minutes/Run | Monthly Cost |
|----------|----------|-------------|--------------|
| cv-enhancement | Daily 11pm UTC | 10 | $2.40 |
| security-scanning | Weekly Monday | 5 | $0.16 |
| testing-pipeline | On-push only | 15 | Variable |
| cost-monitor | Daily noon UTC | 1 | $0.24 |

**Modify Schedule**:
```bash
# Change to less frequent
sed -i "s/'0 23 \* \* \*'/'0 23 \* \* 1'/g" .github/workflows/cv-enhancement.yml
```

## Cost Optimization

### Quick Wins (Immediate)
1. **Cache Dependencies**
   ```yaml
   - uses: actions/cache@v4
     with:
       path: ~/.npm
       key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
   ```

2. **Cancel Previous Runs**
   ```yaml
   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: true
   ```

3. **Skip Unchanged**
   ```yaml
   - name: Check changes
     run: |
       git diff --exit-code HEAD~1 HEAD -- src/ || echo "changed=true" >> $GITHUB_ENV
   - if: env.changed == 'true'
     run: npm test
   ```

### Medium-term (This Week)
1. **Consolidate Workflows**
   - Merge security scans into one job
   - Combine deployment and monitoring

2. **Optimize Test Suite**
   - Run only affected tests
   - Parallel test execution
   - Skip flaky tests

3. **Smart Scheduling**
   - Avoid peak hours (9-5 EST)
   - Stagger workflow starts
   - Use workflow_call for reuse

### Long-term (This Month)
1. **Self-hosted Runner**
   ```yaml
   runs-on: [self-hosted, linux]
   ```

2. **Alternative CI Services**
   - CircleCI: 6,000 free minutes
   - GitLab CI: 400 free minutes
   - Buildkite: Self-hosted option

## Troubleshooting

### Common Issues

**"Billing limit exceeded"**
```bash
# Check exact usage
gh api /users/adrianwedd/settings/billing/actions

# Disable all workflows
find .github/workflows -name "*.yml" -exec sed -i '1s/^/# DISABLED\n/' {} \;

# Contact GitHub support if needed
```

**"Workflow not running"**
```bash
# Check if disabled
head -1 .github/workflows/workflow-name.yml

# Check schedule syntax
grep -A2 "schedule:" .github/workflows/workflow-name.yml

# Manually trigger
gh workflow run workflow-name.yml
```

**"High unexpected usage"**
```bash
# Find long-running workflows
gh run list --json databaseId,displayTitle,status,conclusion,startedAt,updatedAt | \
  jq '.[] | select(.status=="in_progress") | {id:.databaseId, name:.displayTitle, duration:.startedAt}'

# Check for infinite loops
gh run view RUN_ID --log | grep -i "timeout\|loop"

# Review matrix expansion
grep -A5 "strategy:" .github/workflows/*.yml
```

### Monitoring Scripts

**Daily Usage Report**:
```bash
#!/bin/bash
# save as check-usage.sh

USAGE=$(gh api /users/adrianwedd/settings/billing/actions)
MINUTES=$(echo $USAGE | jq '.minutes_used_breakdown.UBUNTU')
COST=$(echo "$MINUTES * 0.008" | bc)

echo "📊 Daily CI/CD Report"
echo "Minutes: $MINUTES"
echo "Cost: \$$COST"
echo "Budget: \$15.00"
echo "Remaining: \$$(echo "15 - $COST" | bc)"
```

**Workflow Efficiency**:
```bash
#!/bin/bash
# save as workflow-efficiency.sh

for workflow in .github/workflows/*.yml; do
  name=$(basename $workflow .yml)
  runs=$(gh run list --workflow=$name --limit=10 --json conclusion,durationMS | \
    jq '[.[] | select(.conclusion=="success")] | length')
  avg_time=$(gh run list --workflow=$name --limit=10 --json durationMS | \
    jq '[.[].durationMS] | add/length/60000' 2>/dev/null || echo "0")

  echo "$name: $runs successful runs, avg ${avg_time}min"
done
```

## Appendix

### Useful Links
- [GitHub Actions Billing](https://docs.github.com/en/billing/managing-billing-for-github-actions)
- [Usage API Documentation](https://docs.github.com/en/rest/billing)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Self-hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)

### Contact
- **On-call**: Check #engineering Slack channel
- **Escalation**: Create P0 issue with `infrastructure` label
- **GitHub Support**: https://support.github.com

### Change Log
| Date | Version | Changes |
|------|---------|---------|
| 2025-09-02 | 1.0 | Initial runbook creation |

---

**Remember**: Every minute counts. Optimize first, run second.
