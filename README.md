# Platform Deployer

Platform Deployer is a static Progressive Web App that generates `terraform.tfvars` and packages it with reviewed Databricks AWS Terraform examples. It is based on the visual design of [One Click Deployer](https://github.com/databricks-solutions/oneclick-deployer), while the Terraform code is copied unchanged from [Technical Services Solutions](https://github.com/databricks-solutions/technical-services-solutions).

The current release supports AWS only:

- Without PrivateLink: `aws-byovpc-uc`
- With PrivateLink: `aws-byovpc-classic-privatelink`

The Technical Services repository is pinned to commit `175101db58231cad1a3a3b8e266a7541735eeeaa`. GitHub Actions fetches that exact revision during every build, validates it, and publishes the resulting static artifact. The browser never fetches code from GitHub.

## Local development

Requirements: Node.js 20+, Git, Terraform 1.14.x, and Chromium for the browser tests.

```sh
npm ci
npm run build
npm start
```

The site is available at <http://localhost:8000>.

Run the complete verification suite with:

```sh
npm test
```

For an offline/local upstream checkout, point the build at the pinned Technical Services repository:

```sh
TERRAFORM_SOURCE_DIR=/path/to/technical-services-solutions npm run build
```

The checkout must be at the SHA configured in `config/upstreams.json`.

## Updating the Terraform source

1. Review the desired Technical Services commit and both configured Terraform directories.
2. Replace the full SHA in `config/upstreams.json`.
3. Run `npm run build`, `npm run test:terraform`, and the browser tests.
4. Commit the SHA change normally. Vendored source files are generated into `dist/` and are not committed.

## Deployment

Pushes to `main` run unit, Terraform, and Playwright tests before the official GitHub Pages actions publish `dist/`. The first successful run enables Pages automatically. The expected URL is:

<https://jpgianfaldoni.github.io/platform-deployer/>

## Security and credentials

The application collects account identifiers needed by the Terraform variables, but never asks for AWS credentials or Databricks OAuth secrets. Form state remains in the browser's local storage. Configure deployment credentials through the environment as described by the upstream README included in each ZIP.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for source attribution and licensing details.
