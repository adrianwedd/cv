# Pre-Session Checklist

## Before Starting Any Work

### 1. Repository State Check
```bash
# Check current branch
git branch
# Should be: * main

# Check status
git status
# Should be: nothing to commit, working tree clean

# Check sync with remote
git fetch origin
git status
# Should be: Your branch is up to date with 'origin/main'
```

### 2. If Repository is NOT Clean
```bash
# Stash any uncommitted work
git stash push -m "WIP: session interrupted"

# Return to main
git checkout main

# Sync with remote
git pull origin main

# Review stashed work later
git stash list
```

### 3. Create Feature Branch
```bash
# ALWAYS create new feature branch
git checkout -b feature/session-YYYY-MM-DD-description

# Example:
git checkout -b feature/session-2025-08-02-navbar-fixes
```

## Session End Checklist

### 1. Commit All Work
```bash
# Add all changes
git add .

# Commit with clear message
git commit -m "feat: implement navbar overlap fix

- Added padding-top to .main-content for navigation clearance
- Fixed Advanced Analytics dashboard initialization
- Resolved UI overlap issues affecting content visibility"
```

### 2. Create PR and Deploy
```bash
# Push feature branch
git push origin feature/session-YYYY-MM-DD-description

# Create PR with auto-merge for safe changes
gh pr create --title "🔧 UI Fixes: Navbar Overlap & Dashboard Init [auto-merge]" \
             --body "Safe UI fixes ready for immediate deployment"
```

### 3. Clean Up After Merge
```bash
# Switch back to main
git checkout main

# Pull latest (includes your merged PR)
git pull origin main

# Delete feature branch
git branch -D feature/session-YYYY-MM-DD-description
```

## Emergency Recovery

If things go wrong:
1. **STOP** - Don't make it worse
2. **Document** - Note current state
3. **Reset** - `git checkout main && git pull origin main`
4. **Clean** - Delete problematic branches
5. **Restart** - Create fresh feature branch