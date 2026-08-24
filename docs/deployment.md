# Deployment

This section details the deployment process for the AI-enhanced CV system, primarily focusing on GitHub Pages, and provides guidance on custom domains and troubleshooting.

## GitHub Pages Setup

The AI-enhanced CV is automatically deployed to [GitHub Pages](https://pages.github.com/) by the `CV Enhancement Pipeline` (`cv-enhancement.yml`) workflow — but only when a run actually changes content (no churn commits). GitHub Pages serves the site directly from the **root of the `main` branch** (not a `gh-pages` branch).

### How it Works

1.  **Build Output**: The `cv-generator.js` script generates all static website assets (HTML, CSS, JavaScript, data files, PDF) into the `dist/` directory.
2.  **Commit Back to `main`**: The `Publish — commit if content changed` step copies the built output from `dist/` back into the working tree on `main` (e.g. `index.html`, `assets/`, `data/`) and commits it directly — with a commit message stating each pipeline stage's real outcome.
3.  **GitHub Pages Hosting**: GitHub Pages serves the content from the `main` branch root. A `.nojekyll` file at the repository root disables Jekyll processing so the static files are served as-is.

> **Note**: The built-in `pages-build-deployment` workflow that GitHub auto-triggers may show as "failed". This is expected and harmless — `.nojekyll` bypasses the Jekyll build path that workflow runs.

### Configuration in `cv-enhancement.yml`

There is no third-party Pages-deploy action (such as `peaceiris/actions-gh-pages`). Deployment is a plain git commit/push performed by the workflow:

*   The `pipeline` job declares only `permissions: contents: write` — enough to push the generated assets back to `main`.
*   The `Publish — commit if content changed` step stages the generated files (and any updated `data/` files) and commits them. A run that changes no content does not commit.

## Custom Domains

The site is served at the custom domain configured by the committed `CNAME` file at the repository root (currently `cv.adrianwedd.com`). There is no `CUSTOM_DOMAIN` secret — the domain is read directly from that file.

To change the custom domain:

1.  **Configure DNS**: In your domain registrar's settings, create a `CNAME` record pointing your desired subdomain (e.g., `cv`) to `<username>.github.io` (e.g., `adrianwedd.github.io`).
2.  **Edit the `CNAME` file**: Update the committed `CNAME` file at the repository root to contain your domain, then commit it to `main`.

## Troubleshooting Deployment Issues

If your CV is not deploying correctly to GitHub Pages, consider the following:

*   **Workflow Status**: Check the `Actions` tab in your GitHub repository. Ensure the `CV Enhancement Pipeline` workflow is completing successfully. Look for any failed steps. (The auto-triggered `pages-build-deployment` showing "failed" is expected and harmless — see the note above.)
*   **Permissions**: Verify that the `pipeline` job has `contents: write` permission so it can commit the generated assets back to `main`.
*   **Generated Output**: Ensure `cv-generator.js` is writing the website files into `dist/` and that the `Publish — commit if content changed` step copies them into the working tree. Remember that a run which changes no content intentionally does not commit.
*   **`CNAME` File**: If using a custom domain, check that the committed `CNAME` file at the repository root exists and contains the correct domain name.
*   **Browser Cache**: Sometimes, browser cache can cause issues. Try clearing your browser's cache or opening the GitHub Pages URL in an incognito/private window.
*   **GitHub Pages Settings**: Verify your repository's GitHub Pages settings (`Settings > Pages`) to ensure it's configured to deploy from the `main` branch root.
*   **Build Errors**: Check the logs of the `Render — website and PDFs` step. Errors here will prevent the website files from being correctly generated.
