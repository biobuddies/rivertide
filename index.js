const environmentPrefix = 'RIVERTIDE_'

const environmentList = document.querySelector('#environment-list')
const emptyState = document.querySelector('#empty-state')
const count = document.querySelector('#count')
const editButton = document.querySelector('#edit-button')
const environmentDialog = document.querySelector('#environment-dialog')
const environmentDefinitions = document.querySelector('#environment-definitions')
const saveButton = document.querySelector('#save-variables')
const poiForm = document.querySelector('#poi-form')
const receiptFile = document.querySelector('#receipt-file')
const receiptSummary = document.querySelector('#receipt-summary')
const receiptName = document.querySelector('#receipt-name')
const extractReceipt = document.querySelector('#extract-receipt')
const poiStatus = document.querySelector('#poi-status')
const verificationResult = document.querySelector('#verification-result')

const environmentKeys = () =>
    Object.keys(localStorage)
        .filter((key) => key.startsWith(environmentPrefix))
        .sort()

const readEnvironment = () =>
    Object.fromEntries(
        environmentKeys().map((key) => [
            key.slice(environmentPrefix.length),
            localStorage.getItem(key),
        ]),
    )

const environmentRow = (name, value, provider) => {
    const row = document.createElement('div')
    const term = document.createElement('dt')
    const detail = document.createElement('dd')
    row.className = 'environment-row'
    term.textContent = name
    if (provider) {
        detail.append(providerIcon(provider))
    } else {
        detail.textContent = value
    }
    row.append(term, detail)
    return row
}

const renderEnvironment = () => {
    const entries = Object.entries(readEnvironment())
    const checks = []
    environmentList.replaceChildren(
        ...entries.map(([name, value]) => {
            const provider = providerForName(name)
            const row = environmentRow(name, value, provider)
            if (provider) {
                checks.push([provider, value, row.querySelector('.provider-icon')])
            }
            return row
        }),
    )
    const length = entries.length
    emptyState.hidden = length > 0
    count.textContent = `${length} ${length === 1 ? 'VARIABLE' : 'VARIABLES'}`
    checks.forEach(([provider, value, icon]) => checkConnection(provider, value, icon))
}

const providers = [
    {
        id: 'deepseek',
        name: 'DeepSeek',
        credentialKeys: ['DEEPSEEK_API_KEY', 'DEEPSEEK_TOKEN'],
        icon: 'M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45',
        check: async (token) => {
            const response = await fetch('https://api.deepseek.com/models', {
                headers: {Authorization: `Bearer ${token}`},
            })
            return response.ok
        },
    },
    {
        id: 'github',
        name: 'GitHub',
        credentialKeys: ['GITHUB_TOKEN', 'GH_TOKEN'],
        icon: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
        check: async (token) => {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            })
            return response.ok
        },
    },
]

const connectionStatusLabels = {
    off: 'disconnected',
    checking: 'checking',
    on: 'connected',
    error: 'error',
}

const providerForName = (name) =>
    providers.find((provider) => provider.credentialKeys.some((key) => key === name.toUpperCase()))

const providerIcon = (provider) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('role', 'img')
    svg.classList.add('provider-icon', 'is-off')
    svg.setAttribute('aria-label', `${provider.name} ${connectionStatusLabels.off}`)
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', provider.icon)
    svg.append(path)
    return svg
}

const setConnectionStatus = (icon, provider, status) => {
    icon.classList.remove('is-off', 'is-checking', 'is-on', 'is-error')
    icon.classList.add(`is-${status}`)
    icon.setAttribute('aria-label', `${provider.name} ${connectionStatusLabels[status]}`)
}

const checkConnection = async (provider, token, icon) => {
    setConnectionStatus(icon, provider, 'checking')
    try {
        const connected = await provider.check(token)
        setConnectionStatus(icon, provider, connected ? 'on' : 'error')
    } catch {
        setConnectionStatus(icon, provider, 'error')
    }
}

const serializeValue = (value) => (/^[^\s#;"'[\]]+$/.test(value) ? value : JSON.stringify(value))

const serializeEnvironment = () =>
    Object.entries(readEnvironment())
        .map(([name, value]) => `${name} = ${serializeValue(value)}`)
        .join('\n')

const unquoteValue = (value) => {
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
        try {
            return JSON.parse(value)
        } catch {
            return value.slice(1, -1)
        }
    }
    if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
        return value.slice(1, -1)
    }
    return value
}

const parseEnvironment = (text) => {
    const variables = new Map()
    text.split('\n').forEach((line, index) => {
        const trimmed = line.trim()
        if (
            !trimmed ||
            trimmed.startsWith('#') ||
            trimmed.startsWith(';') ||
            trimmed.startsWith('[')
        ) {
            return
        }
        const separator = trimmed.indexOf('=')
        if (separator < 1) {
            throw new Error(`Line ${index + 1}: expected NAME = value`)
        }
        const name = trimmed.slice(0, separator).trim()
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
            throw new Error(`Line ${index + 1}: invalid variable name`)
        }
        variables.set(name.toUpperCase(), unquoteValue(trimmed.slice(separator + 1).trim()))
    })
    return variables
}

const openDialog = () => {
    environmentDefinitions.setCustomValidity('')
    environmentDefinitions.value = serializeEnvironment()
    environmentDialog.showModal()
}

const saveEnvironment = () => {
    let variables
    try {
        variables = parseEnvironment(environmentDefinitions.value)
    } catch (error) {
        environmentDefinitions.setCustomValidity(error.message)
        environmentDefinitions.reportValidity()
        environmentDefinitions.setCustomValidity('')
        environmentDefinitions.focus()
        return
    }
    environmentKeys().forEach((key) => localStorage.removeItem(key))
    variables.forEach((value, name) => localStorage.setItem(environmentPrefix + name, value))
    renderEnvironment()
    environmentDialog.close()
}

const setReceipt = () => {
    const file = receiptFile.files[0]
    receiptSummary.hidden = !file
    receiptName.textContent = file ? `${file.name} · ${(file.size / 1_000_000).toFixed(2)} MB` : ''
    extractReceipt.disabled = !file
}

const extractReceiptDetails = async () => {
    const variables = readEnvironment()
    if (!variables.INFERENCE_API_URL || !variables.INFERENCE_API_KEY) {
        location.hash = 'environment'
        openDialog()
        environmentDefinitions.setCustomValidity('Add INFERENCE_API_URL and INFERENCE_API_KEY')
        environmentDefinitions.reportValidity()
        return
    }
    poiStatus.textContent = 'EXTRACTING'
    extractReceipt.disabled = true
    const body = new FormData()
    body.append('receipt', receiptFile.files[0])
    body.append('cross_check', document.querySelector('#cross-check').checked)
    try {
        const response = await fetch(variables.INFERENCE_API_URL, {
            method: 'POST',
            headers: {Authorization: `Bearer ${variables.INFERENCE_API_KEY}`},
            body,
        })
        if (!response.ok) throw new Error(`Inference API returned ${response.status}`)
        const details = await response.json()
        Object.entries(details.poi || details).forEach(([name, value]) => {
            const field = poiForm.elements.namedItem(name)
            if (field && typeof value === 'string') field.value = value
        })
        verificationResult.hidden = !details.verification
        verificationResult.textContent = details.verification || ''
        poiStatus.textContent = 'REVIEW OCR'
    } catch (error) {
        poiStatus.textContent = 'OCR FAILED'
        verificationResult.hidden = false
        verificationResult.textContent = error.message
    } finally {
        extractReceipt.disabled = false
    }
}

const prepareOsmEdit = (event) => {
    event.preventDefault()
    const variables = readEnvironment()
    if (!variables.OSM_ACCESS_TOKEN) {
        location.hash = 'environment'
        openDialog()
        environmentDefinitions.setCustomValidity('Add OSM_ACCESS_TOKEN before preparing an edit')
        environmentDefinitions.reportValidity()
        return
    }
    poiStatus.textContent = 'READY TO REVIEW'
    verificationResult.hidden = false
    verificationResult.textContent =
        'Draft prepared locally. Review the tags before publishing to OSM.'
}

editButton.addEventListener('click', openDialog)
saveButton.addEventListener('click', saveEnvironment)
document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => environmentDialog.close())
})
receiptFile.addEventListener('change', setReceipt)
document.querySelector('#remove-receipt').addEventListener('click', () => {
    receiptFile.value = ''
    setReceipt()
})
extractReceipt.addEventListener('click', extractReceiptDetails)
poiForm.addEventListener('submit', prepareOsmEdit)

renderEnvironment()
setReceipt()
