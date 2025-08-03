# Security Implementation Guide

## Content Security Policy (CSP)

### Implementation
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;">
```

### Testing
```bash
curl -I https://adrianwedd.github.io/cv | grep -i content-security-policy
```

### Expected Result
- CSP header present in response
- No console errors related to CSP violations
- All resources load correctly

## Subresource Integrity (SRI)

### Implementation
```html
<script src="https://cdn.jsdelivr.net/npm/library@1.0.0/dist/lib.min.js" 
        integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC" 
        crossorigin="anonymous"></script>
```

### Generate SRI Hash
```bash
curl -s https://cdn.jsdelivr.net/npm/library@1.0.0/dist/lib.min.js | openssl dgst -sha384 -binary | openssl base64 -A
```

## Security Headers Checklist

- [ ] Content-Security-Policy
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Strict-Transport-Security
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy
