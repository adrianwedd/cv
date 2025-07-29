# Deployment

This section details the deployment process for the AI-enhanced CV system, primarily focusing on GitHub Pages, and provides guidance on custom domains and troubleshooting.

## GitHub Pages Setup

The AI-enhanced CV is designed to be automatically deployed to [GitHub Pages](https://pages.github.com/) with each successful run of the `🚀 CV Auto-Enhancement Pipeline` (`cv-enhancement.yml`) workflow.

### How it Works

1.  **Build Output**: The `cv-generator.js` script generates all static website assets (HTML, CSS, JavaScript, data files, PDF) into the `dist/` directory.
2.  **Deployment Action**: The `peaceiris/actions-gh-pages@v3` GitHub Action is used to deploy the contents of the `dist/` directory to the `gh-pages` branch of the repository.
3.  **GitHub Pages Hosting**: GitHub Pages then serves the content from the `gh-pages` branch, making the CV accessible at a URL like `https://<username>.github.io/<repository-name>` (e.g., `https://adrianwedd.github.io/cv`).

### Configuration in `cv-enhancement.yml`

The deployment step in the workflow is configured as follows:

```yaml
      - name: 🚀 Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          cname: ${{ secrets.CUSTOM_DOMAIN }}
```

*   **`github_token`**: Uses the default `GITHUB_TOKEN` provided by GitHub Actions, which has sufficient permissions to push to the `gh-pages` branch.
*   **`publish_dir`**: Specifies that the `dist/` directory should be deployed.
*   **`cname`**: (Optional) Allows specifying a custom domain for the GitHub Pages site. This value is pulled from a GitHub Secret named `CUSTOM_DOMAIN`.

## Custom Domains

To use a custom domain (e.g., `cv.yourdomain.com`) for your GitHub Pages CV, follow these steps:

1.  **Configure DNS**: In your domain registrar's settings, create a `CNAME` record that points your desired subdomain (e.g., `cv`) to `<username>.github.io/<repository-name>` (e.g., `adrianwedd.github.io/cv`).
2.  **GitHub Secret**: Add your custom domain as a repository secret named `CUSTOM_DOMAIN` in your GitHub repository settings (`Settings > Secrets and variables > Actions > New repository secret`).
3.  **Workflow Execution**: The `cv-generator.js` script will automatically create a `CNAME` file in the `dist/` directory with your custom domain, which the `peaceiris/actions-gh-pages` action will then deploy.

## Troubleshooting Deployment Issues

If your CV is not deploying correctly to GitHub Pages, consider the following:

*   **Workflow Status**: Check the `Actions` tab in your GitHub repository. Ensure the `🚀 CV Auto-Enhancement Pipeline` workflow is completing successfully. Look for any failed steps.
*   **Permissions**: Verify that the `GITHUB_TOKEN` has `contents: write` and `pages: write` permissions in your workflow file.
*   **`publish_dir`**: Ensure the `publish_dir` in the deployment step (`./dist`) correctly points to the directory where your `cv-generator.js` script outputs the website files.
*   **`CNAME` File**: If using a custom domain, check the `gh-pages` branch of your repository to ensure the `CNAME` file exists and contains the correct domain name.
*   **Browser Cache**: Sometimes, browser cache can cause issues. Try clearing your browser's cache or opening the GitHub Pages URL in an incognito/private window.
*   **GitHub Pages Settings**: Verify your repository's GitHub Pages settings (`Settings > Pages`) to ensure it's configured to deploy from the `gh-pages` branch.
*   **Build Errors**: Check the logs of the `🎨 Dynamic CV Website Generation` step. Errors here will prevent the website files from being correctly generated.
