"""Deploy the RIVERTIDE static site to a Cloudflare Worker.

The main workspace publishes production rt.biobuddi.es; every other workspace previews at
rt-${terraform.workspace}.biobuddi.es. The R2 backend reads AWS_ENDPOINT_URL_S3.
"""

from os import environ

from helicopyter import Block, data, registry, resource
from helicopyter.cloudflare import jam
from stacks.base import provide

account_id = environ['CLOUDFLARE_ACCOUNT_ID']
zone_id = environ['CLOUDFLARE_ZONE_ID']

provide('cloudflare/cloudflare', '5.25.0')

# Foundational networking for biobuddi.es
# Main, and serene-hawking until main first deploys, owns the proxied records jam() requires,
# adopting any that already exist
owns = 'contains(["main", "serene-hawking"], terraform.workspace)'
names = '{"rt" = "rt.biobuddi.es", "*" = "*.biobuddi.es"}'
records = '[for record in data.cloudflare_dns_records.existing.result : record if record.proxied]'
data.cloudflare_dns_records.existing(name={'endswith': 'biobuddi.es'}, zone_id=zone_id)
Block('import')(
    for_each=Block(
        '%s ? {for key, name in %s : key => one('
        '[for record in %s : record.id if record.name == name]) if anytrue('
        '[for record in %s : record.name == name])} : {}' % (owns, names, records, records)
    ),
    id=Block('"%s/${each.value}"' % zone_id),
    to=Block('cloudflare_dns_record.this[each.key]'),
)
resource.cloudflare_dns_record.this(
    content='100::',
    for_each=Block('%s ? %s : {}' % (owns, names)),
    name=Block('each.value'),
    proxied=True,
    ttl=1,
    type='AAAA',
    zone_id=zone_id,
)

# Rivertide specifics
jam('rt.biobuddi.es/', account_id=account_id, zone_id=zone_id)
next(block for block in registry if block.labels == ('cloudflare_dns_records', 'this')).attributes[
    'depends_on'
] = [Block('cloudflare_dns_record.this')]
