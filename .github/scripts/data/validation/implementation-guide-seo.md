# SEO Implementation Guide

## Structured Data (JSON-LD)

### Implementation
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Adrian Wedd",
  "jobTitle": "Systems Analyst & Developer",
  "url": "https://adrianwedd.github.io/cv",
  "sameAs": [
    "https://github.com/adrianwedd",
    "https://linkedin.com/in/adrianwedd"
  ]
}
</script>
```

### Testing
```bash
curl -s https://adrianwedd.github.io/cv | grep -A 20 "application/ld+json"
```

## Open Graph Protocol

### Implementation
```html
<meta property="og:title" content="Adrian Wedd - Systems Analyst & Developer">
<meta property="og:description" content="Professional CV showcasing expertise in systems analysis and development.">
<meta property="og:type" content="profile">
<meta property="og:url" content="https://adrianwedd.github.io/cv">
<meta property="og:image" content="https://adrianwedd.github.io/cv/assets/profile-image.jpg">
```

## SEO Checklist

- [ ] Unique, descriptive title tag
- [ ] Meta description 120-160 characters
- [ ] Canonical URL specified
- [ ] Open Graph tags complete
- [ ] Twitter Card metadata
- [ ] Structured data implemented
- [ ] H1 tag unique and descriptive
- [ ] Heading hierarchy logical
