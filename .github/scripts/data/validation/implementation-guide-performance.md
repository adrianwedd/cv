# Performance Implementation Guide

## Resource Optimization

### Preload Critical Resources
```html
<link rel="preload" href="assets/styles.css" as="style">
<link rel="preload" href="assets/script.js" as="script">
<link rel="preconnect" href="https://fonts.googleapis.com">
```

### Optimize Images
```html
<img src="profile.jpg" 
     alt="Adrian Wedd" 
     loading="lazy"
     width="300" 
     height="300">
```

## Compression Configuration

### GitHub Pages Optimization
GitHub Pages automatically compresses content, but ensure:
- Minified CSS/JS
- Optimized images
- Appropriate caching headers

## Performance Checklist

- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] First Input Delay < 100ms
- [ ] Resources preloaded
- [ ] Images optimized
- [ ] CSS/JS minified
