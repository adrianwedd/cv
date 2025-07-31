# Contributing to AI-Enhanced CV System

Thank you for your interest in contributing! This project showcases how AI can enhance professional portfolios, and we welcome contributions that improve the system.

## 🤝 Code of Conduct

By participating in this project, you agree to be respectful, inclusive, and professional. We're building a welcoming community for all skill levels.

## 🚀 Getting Started

1. **Fork the repository**
   ```bash
   gh repo fork adrianwedd/cv --clone
   ```

2. **Install dependencies**
   ```bash
   cd cv/.github/scripts
   npm install
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 What Can You Contribute?

### 🐛 Bug Fixes
- Check existing issues labeled `bug`
- Provide clear reproduction steps
- Include error logs and context

### ✨ Features
- Discuss in GitHub Discussions first
- Check if there's an existing issue
- Keep changes focused and atomic

### 📚 Documentation
- Fix typos and clarify instructions
- Add examples and use cases
- Improve setup guides

### 🎨 UI/UX Improvements
- Enhance responsive design
- Improve accessibility
- Add visual polish

### 🧪 Tests
- Add missing test coverage
- Fix failing tests
- Improve test quality

## 🔄 Development Workflow

### 1. **Before You Start**
- Check existing issues and PRs
- Discuss major changes in Discussions
- Claim an issue by commenting

### 2. **Development**
```bash
# Make your changes
npm test              # Run tests
npm run lint          # Check code style
npm run lint:fix      # Auto-fix issues
```

### 3. **Commit Messages**
Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Formatting changes
- `refactor:` Code restructuring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

Example:
```bash
git commit -m "feat: add LinkedIn integration to activity analyzer"
```

### 4. **Pull Request**
- Use the PR template
- Link related issues
- Include screenshots for UI changes
- Ensure CI passes

## 🏗️ Project Structure

```
cv/
├── .github/
│   ├── workflows/      # GitHub Actions
│   └── scripts/        # Enhancement scripts
├── assets/            # CSS, JS, images
├── data/              # CV data files
├── dist/              # Built output
└── index.html         # Main CV page
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Tests
```bash
npm test -- activity-analyzer.test.js
```

### Test Coverage
```bash
npm run test:coverage
```

## 🎯 Coding Standards

### JavaScript
- ES6+ syntax
- Async/await over callbacks
- Meaningful variable names
- JSDoc comments for functions

### CSS
- Use CSS custom properties
- Mobile-first responsive design
- Follow BEM naming when applicable
- Ensure accessibility (WCAG 2.1 AA)

### General
- No hardcoded credentials
- Handle errors gracefully
- Add logging for debugging
- Keep functions focused

## 🔍 Code Review Process

1. **Automated checks** must pass
2. **Maintainer review** for approval
3. **Address feedback** constructively
4. **Squash commits** if requested

## 🚢 Release Process

We use semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes
- **MINOR**: New features
- **PATCH**: Bug fixes

Releases are automated through GitHub Actions.

## 💡 Need Help?

- **Questions**: Use GitHub Discussions Q&A
- **Bugs**: Create an issue
- **Ideas**: Share in Discussions
- **Security**: See SECURITY.md

## 🙏 Recognition

Contributors are acknowledged in:
- Release notes
- Contributors section in README
- Special thanks in documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Ready to contribute? We're excited to see what you'll build! 🎉