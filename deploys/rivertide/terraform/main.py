"""Deploy the RIVERTIDE static site to a Cloudflare Worker.

`main` publishes production rt.biobuddi.es; every other branch previews at
rt-${var.tabr}.biobuddi.es. The R2 backend reads AWS_ENDPOINT_URL_S3.
"""

from os import environ
from pathlib import Path

from helicopyter import Block, provider, resource, string, terraform, variable

account_id = environ['CLOUDFLARE_ACCOUNT_ID']
zone_id = environ['CLOUDFLARE_ZONE_ID']

terraform.backend('s3')(
    bucket='terraform',
    key='rivertide.tfstate',
    region='auto',
    workspace_key_prefix='rivertide',
    skip_credentials_validation='true',
    skip_metadata_api_check='true',
    skip_region_validation='true',
    skip_requesting_account_id='true',
    skip_s3_checksum='true',
    use_path_style='true',
)
terraform.required_providers(cloudflare={'source': 'cloudflare/cloudflare', 'version': '5.14.0'})

provider.cloudflare()

variable.tabr(type=string, default='main')

resource.cloudflare_workers_script('this')(
    account_id=account_id,
    assets={
        'config': {'not_found_handling': 'single-page-application'},
        'directory': '../../../public',
    },
    compatibility_date='2026-08-28',
    content=(Path(__file__).parent / 'worker.js').read_text(),
    main_module='worker.js',
    script_name='rivertide-${var.tabr}',
)

resource.cloudflare_workers_script_subdomain('this')(
    account_id=account_id,
    enabled=False,
    previews_enabled=False,
    script_name=Block('cloudflare_workers_script', 'this', 'script_name'),
)

resource.cloudflare_workers_custom_domain('this')(
    account_id=account_id,
    environment='production',
    hostname=Block('var.tabr == "main" ? "rt.biobuddi.es" : "rt-${var.tabr}.biobuddi.es"'),
    service=Block('cloudflare_workers_script', 'this', 'script_name'),
    zone_id=zone_id,
)
