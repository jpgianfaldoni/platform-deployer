# Third-party sources

## One Click Deployer

The interface design and static PWA foundation are adapted from [`databricks-solutions/oneclick-deployer`](https://github.com/databricks-solutions/oneclick-deployer) at commit `8fb09724069cab724bd3e215ef35c7c2f8da7e56`.

At the time of adaptation, that repository declared `MIT` in `package.json` but did not contain a standalone license file. Reuse in this project assumes the repository owner's authorization.

## Technical Services Solutions

Terraform projects are copied without modification from [`databricks-solutions/technical-services-solutions`](https://github.com/databricks-solutions/technical-services-solutions) at the commit configured in `config/upstreams.json`.

The Databricks license and notice from that repository are retained in the GitHub Pages build artifact alongside the vendored sources. Generated ZIPs contain only the selected example and generated `terraform.tfvars` file.
