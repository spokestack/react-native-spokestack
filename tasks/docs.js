const fs = require('fs')
const prettier = require('prettier')
const pkg = require('../package.json')
function read(filename) {
  return fs.readFileSync(`${__dirname}/${filename}`, { encoding: 'utf8' })
}
function write(filename, data) {
  return fs.writeFileSync(`${__dirname}/${filename}`, data)
}

// Remove links that aren't links to source
function removeLinks(data) {
  return data.replace(/\[([^:]+)\]\(.*?\)/g, '$1')
}

function addLinks(data) {
  return data
    .replace(
      /\bPipelineProfile([^.])/g,
      '[PipelineProfile](#PipelineProfile)$1'
    )
    .replace(/\bTTSFormat([^.])/g, '[TTSFormat](#TTSFormat)$1')
    .replace(/\bTraceLevel([^.])/g, '[TraceLevel](#TraceLevel)$1')
    .replace(
      /\bSpokestackConfig([^.])/g,
      '[SpokestackConfig](#SpokestackConfig)$1'
    )
    .replace(/\bNLUConfig([^.])/g, '[NLUConfig](#NLUConfig)$1')
    .replace(/\bPipelineConfig([^.])/g, '[PipelineConfig](#PipelineConfig)$1')
    .replace(/\bWakewordConfig([^.])/g, '[WakewordConfig](#WakewordConfig)$1')
}

function redoLinks(data) {
  return addLinks(removeLinks(data))
}

/**
 * @param {Array<string>} functions List of functions to extract from docs
 */
function getFunctions(functions) {
  const available = redoLinks(read('../docs/README.md'))
    // Remove everything up to functions
    .replace(/[^]+#{2}\s*Functions/, '')
    .split(/___/)
  return functions
    .map((fn) => {
      const rfn = new RegExp(`###\\s*${fn}[^#]+?`)
      const doc = available.find((existing) => rfn.test(existing))
      return doc || ''
    })
    .join('\n\n')
}

function getInterfaceContent(filename) {
  return removeLinks(
    read(`../docs/interfaces/${filename}`)
      .replace(/# Interface:\s*(.+)[^]+##\s*Properties/, '#### $1')
      .replace(/___/g, '')
      .replace(/\n### /g, '\n##### ')
      // Remove superfluous type declarations
      .replace(/#### Type declaration:[^]+?▸ .+/g, '')
      // Remove double "Defined in"
      .replace(/(Defined in: .+)\n\nDefined in: .+/g, '$1')
  )
}

function getEnumContent(filename) {
  return removeLinks(
    read(`../docs/enums/${filename}`)
      .replace(/# Enumeration:\s*(.+)/, '#### $1')
      .replace(/\[.+\]\([./a-z]+\)\..+/, '')
      .replace(/\n### .+/g, '')
      .replace(/## Table of contents[^]+## Enumeration members/, '')
      .replace(/___/g, '')
  )
}

// Start with the README
const header = '\n---\n\n# API Documentation'
let data =
  read('../README.md').replace(new RegExp(header + '[^]+'), '') +
  header +
  '\n\n'

// Add Spokestack methods from README
data += getFunctions([
  'initialize',
  'start',
  'stop',
  'activate',
  'deactivate',
  'synthesize',
  'speak',
  'classify'
])

data += getInterfaceContent('spokestacknluresult.md')
data += getInterfaceContent('spokestacknluslots.md')
data += getInterfaceContent('spokestacknluslot.md')

data += getFunctions([
  'addEventListener',
  'removeEventListener',
  'removeAllListeners'
])

data += getEnumContent('ttsformat.md')

// Add events table
data += '\n\n---\n\n'
data += read('../EVENTS.md')

// Add Spokestack config
data += '\n\n---\n\n## SpokestackConfig'
data +=
  '\n\nThese are the configuration options that can be passed to `Spokestack.initialize(_, _, spokestackConfig)`. No options in SpokestackConfig are required.'
data += '\n\nSpokestackConfig has the following structure:\n'
data += `\n\n
\`\`\`ts
${read('../src/types.ts').match(/interface SpokestackConfig[^}]+\}/)[0]}
\`\`\`
`
data += getEnumContent('tracelevel.md')
data += getEnumContent('pipelineprofile.md')
data += getInterfaceContent('pipelineconfig.md')
data += getInterfaceContent('nluconfig.md')
data += getInterfaceContent('wakewordconfig.md')

// Add license info
data += `\n---\n\n ## License\n\nApache-2.0\n\nCopyright ${new Date().getFullYear()} Spokestack\n`

// Write a pretty version
write(
  '../README.md',
  prettier.format(data, { ...pkg.prettier, parser: 'markdown' })
)
