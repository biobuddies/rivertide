"""Deploy the RIVERTIDE static site to a Cloudflare Worker.

The main workspace publishes production rt.biobuddi.es; every other workspace previews at
rt-${terraform.workspace}.biobuddi.es. The R2 backend reads AWS_ENDPOINT_URL_S3.
"""

from os import environ

from helicopyter import provider, terraform
from helicopyter.cloudflare import jam

account_id = environ['CLOUDFLARE_ACCOUNT_ID']

terraform.backend('s3')(
    bucket='terraform',
    endpoints={'s3': f'https://{account_id}.r2.cloudflarestorage.com'},
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
terraform.required_providers(cloudflare={'source': 'cloudflare/cloudflare', 'version': '5.25.0'})

provider.cloudflare()

jam('rt.biobuddi.es/', account_id=account_id)
