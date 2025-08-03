# Accessibility Implementation Guide

## ARIA Landmarks

### Implementation
```html
<nav role="navigation" aria-label="Main navigation">
<main role="main" aria-label="CV Content">
<section aria-labelledby="experience-heading">
  <h2 id="experience-heading">Professional Experience</h2>
</section>
```

## Semantic HTML Structure

### Before (Div-based)
```html
<div class="header">
  <div class="title">Adrian Wedd</div>
</div>
<div class="content">
  <div class="section">Experience</div>
</div>
```

### After (Semantic)
```html
<header>
  <h1>Adrian Wedd</h1>
</header>
<main>
  <section aria-labelledby="experience-heading">
    <h2 id="experience-heading">Experience</h2>
  </section>
</main>
```

## WCAG 2.1 AA Checklist

- [ ] Color contrast ratio ≥ 4.5:1
- [ ] All images have alt text
- [ ] Heading hierarchy is logical
- [ ] Form labels are associated
- [ ] Focus indicators are visible
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
