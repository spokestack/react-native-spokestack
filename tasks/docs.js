const fs = require('fs')
const prettier = require('prettier')
const pkg = require('../package.json')
function read(filename) {
  return fs.readFileSync(`${__dirname}/${filename}`, { encoding: 'utf8' })
}
function write(filename, data) {
  return fs.writeFileSync(`${__dirname}/${filename}`, data)
}

function redoLinks(data) {
  return (
    data
      // Remove links that aren't links to source
      .replace(/\[([^:]+)\]\(.*?\)/g, '$1')
      .replace(
        /PipelineProfile([^.])/g,
        '[PipelineProfile](#PipelineProfile)$1'
      )
      .replace(/TTSFormat([^.])/g, '[TTSFormat](#TTSFormat)$1')
      .replace(/TraceLevel([^.])/g, '[TraceLevel](#TraceLevel)$1')
      .replace(/SpokestackConfig/g, '[SpokestackConfig](#SpokestackConfig)')
      .replace(/NLUConfig/g, '[NLUConfig](#NLUConfig)')
      .replace(/PipelineConfig/g, '[PipelineConfig](#PipelineConfig)')
      .replace(/WakewordConfig/g, '[WakewordConfig](#WakewordConfig)')
  )
}

function getInterfaceContentSplit(filename) {
  return (
    redoLinks(read(`../docs/interfaces/${filename}`))
      // Remove everything up to properties
      .replace(/[^]+\n##\s*Properties/, '')
      .replace(/undefined \\\| /g, '')
      .split(/(?:___|## Methods)/)
  )
}

function getEnumContent(filename) {
  return redoLinks(read(`../docs/enums/${filename}`))
    .replace(/[^]+##\s*Enumeration members/, '')
    .replace(/\n### .+/g, '')
    .replace(/___/g, '')
}

/**
 * @param {string} filename
 * @param {Array<string>} items List of functions or properties to extract from an interface
 */
function getInterfaceItems(filename, items, header = '###') {
  const data = getInterfaceContentSplit(filename)
  return items
    .map((fn) => {
      const rfn = new RegExp(`\\n###\\s*${fn}`)
      for (const m of data) {
        if (rfn.test(m)) {
          return m.replace('###', header)
        }
      }
      console.warn(`Item not found: ${fn}`)
      return ''
    })
    .join('\n\n---\n\n')
}

// Start with the README
const header = '\n---\n\n# API Documentation'
let data =
  read('../README.md').replace(new RegExp(header + '[^]+'), '') +
  header +
  '\n\n'

// Add Spokestack methods
data += getInterfaceItems('_src_index_.spokestacktype.md', [
  'initialize',
  'start',
  'stop',
  'activate',
  'deactivate',
  'synthesize',
  'speak',
  'classify'
])

data += '\n\n---\n\n#### SpokestackNLUResult'
data += getInterfaceItems(
  '_src_types_.spokestacknluresult.md',
  ['intent', 'confidence', 'slots'],
  '#####'
)
data += '\n\n---\n\n#### SpokestackNLUSlot'
data += getInterfaceItems(
  '_src_types_.spokestacknluslot.md',
  ['type', 'value', 'rawValue'],
  '#####'
)

data += getInterfaceItems('_src_index_.spokestacktype.md', [
  'addEventListener',
  'removeEventListener',
  'removeAllListeners'
])

// Add TTSFormat
data += '\n\n---\n\n### TTSFormat'
data += getEnumContent('_src_types_.ttsformat.md')

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
data += '\n\n### TraceLevel'
data += getEnumContent('_src_types_.tracelevel.md')

data += '\n\n## PipelineConfig'
data += getInterfaceItems('_src_types_.pipelineconfig.md', ['profile'])
data += '\n\n### PipelineProfile'
data += getEnumContent('_src_types_.pipelineprofile.md')
data += getInterfaceItems('_src_types_.pipelineconfig.md', [
  'sampleRate',
  'frameWidth',
  'bufferWidth',
  'vadMode',
  'vadFallDelay',
  'vadRiseDelay',
  'ansPolicy',
  'agcCompressionGainDb',
  'agcTargetLevelDbfs'
])

data += '\n\n## NLUConfig'
data += getInterfaceItems('_src_types_.nluconfig.md', [
  'model',
  'metadata',
  'vocab',
  'inputLength'
])

data += '\n\n## WakewordConfig'
data += getInterfaceItems('_src_types_.wakewordconfig.md', [
  'filter',
  'detect',
  'encode'
])
data += '\n\n---\n\n'
const wakewordConfig = getInterfaceContentSplit('_src_types_.wakewordconfig.md')
data += wakewordConfig
  .filter((prop) => prop.indexOf('`Optional`') > -1)
  .join('\n\n---\n\n')

// Add license info
data += `\n---\n\n ## License\n\nApache-2.0\n\nCopyright ${new Date().getFullYear()} Spokestack\n`

// Write a pretty version
write(
  '../README.md',
  prettier.format(data, { ...pkg.prettier, parser: 'markdown' })
)
