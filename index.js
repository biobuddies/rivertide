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

const environmentRow = (name, value) => {
    const row = document.createElement('div')
    const term = document.createElement('dt')
    const detail = document.createElement('dd')
    row.className = 'environment-row'
    term.textContent = name
    detail.textContent = value
    row.append(term, detail)
    return row
}

const renderEnvironment = () => {
    const variables = readEnvironment()
    environmentList.replaceChildren(
        ...Object.entries(variables).map(([name, value]) => environmentRow(name, value)),
    )
    const length = Object.keys(variables).length
    emptyState.hidden = length > 0
    count.textContent = `${length} ${length === 1 ? 'VARIABLE' : 'VARIABLES'}`
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
