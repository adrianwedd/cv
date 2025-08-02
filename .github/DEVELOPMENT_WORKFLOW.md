# Development Workflow Guidelines

## Git Flow Rules

### 1. Branch Strategy
- **main**: Production branch (protected)
- **feature/**: All development work
- **hotfix/**: Emergency fixes only

### 2. Development Process
```bash
# ALWAYS start from latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/descriptive-name

# Work and commit
git add .
git commit -m "type: description"

# Push and create PR
git push origin feature/descriptive-name
gh pr create --title "Title" --body "Description"

# After PR merge, clean up
git checkout main
git pull origin main
git branch -D feature/descriptive-name
```

### 3. NEVER Do This
- ❌ Direct commits to main
- ❌ Continue working on merged feature branches
- ❌ Force push to main
- ❌ Merge without PR review

### 4. Emergency Fixes
```bash
# For urgent fixes only
git checkout main
git pull origin main
git checkout -b hotfix/urgent-issue
# Fix, commit, push, PR, merge immediately
```

### 5. Session Management
- Start each session: Check branch status
- End each session: Clean branch state
- Document any incomplete work
- Never leave branches in mixed states

## Commit Standards
- Use conventional commits: `type: description`
- Types: feat, fix, docs, style, refactor, test, chore
- Keep commits atomic and focused
- Write clear, concise commit messages

## Quality Gates
- All PRs require CI to pass
- Use auto-merge for safe changes: `[auto-merge]` in title
- Manual review for complex features
- No merging broken CI

## Recovery Procedures
If git state becomes chaotic:
1. Stop all work immediately
2. Document current state
3. Create clean feature branch from main
4. Cherry-pick only needed commits
5. Delete problematic branches
6. Resume from clean state