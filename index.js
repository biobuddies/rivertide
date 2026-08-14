const environmentPrefix = 'RIVERTIDE_'

const environmentList = document.querySelector('#environment')
const emptyState = document.querySelector('#empty-state')
const count = document.querySelector('#count')
const editButton = document.querySelector('#edit-button')
const environmentDialog = document.querySelector('#environment-dialog')
const environmentDefinitions = document.querySelector('#environment-definitions')
const saveButton = document.querySelector('#save-variables')

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

editButton.addEventListener('click', openDialog)
saveButton.addEventListener('click', saveEnvironment)
document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => environmentDialog.close())
})

renderEnvironment()
