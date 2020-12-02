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
  )
}

/**
 * @param {string} filename
 * @param {Array<string>} methods List of methods to extract from docs
 */
function getClassMethods(filename, methods) {
  const fileData = redoLinks(read(`../docs/classes/${filename}`))
    // Remove everything up to methods
    .replace(/[\w\W]+#{2}\s*Methods/, '')
    .replace(/___/g, '')
  return methods
    .map((method) => {
      const rmethod = new RegExp(`#\\s*(${method}[^]+?)##`)
      const match = rmethod.exec(fileData)
      return match ? `\n---\n### ${match[1]}` : ''
    })
    .join('\n\n')
}

function getInterfaceContent(filename) {
  return redoLinks(read(`../docs/interfaces/${filename}`))
    .replace(/[\w\W]+##\s*Properties/, '')
    .replace(/___/g, '')
    .replace(/\n### /g, '\n### ')
}

function getEnumContent(filename) {
  return redoLinks(read(`../docs/enums/${filename}`))
    .replace(/[\w\W]+##\s*Enumeration members/, '')
    .replace(/___/g, '')
    .replace(/\n### /g, '\n### ')
}

/**
 * @param {string} filename
 * @param {Array<string>} functions List of functions to extract from docs
 */
function getModuleFunctions(filename, functions) {
  const fileData = redoLinks(read(`../docs/modules/${filename}`))
    // Remove everything up to functions
    .replace(/[\w\W]+#{2}\s*Functions/, '')
    .replace(/___/g, '')
  return functions
    .map((fn) => {
      const rfn = new RegExp(`#\\s*(${fn}[^]+?)##`)
      const match = rfn.exec(fileData)
      return match ? `\n---\n### ${match[1]}` : ''
    })
    .join('\n\n')
}

const rprops = /(?:`Optional` )?\*\*(\w+)\*\*\s*: [^\n]+/g
const rdefaultProps = /`(\w+)` \|[^|]+\|\s*([^|]+) |/g
const renum = /\*\*(\w+)\*\*:\s*=\s*([^\n]+)/g

// Start with the README
const header = '\n---\n\n# API Documentation'
let data =
  read('../README.md').replace(new RegExp(header + '[^]+'), '') + header

// Default values for SpokestackConfig
// const defaultOptions = redoLinks(
//   read('../docs/classes/_src_spokestacktray_.spokestacktray.md')
// )
//   // Remove unwanted text
//   .replace(/[\w\W]+\*\*defaultProps\*\*: object/, '')

// const parsedDefaults = {}
// defaultOptions.replace(rdefaultProps, function (all, key, value) {
//   parsedDefaults[key] = value
//   return all
// })
// console.log(parsedDefaults)

data += '\n\n---\n\n'
data += read('./EVENTS.md')

// Add license info
data += `\n---\n\n ## License\n\nApache-2.0\n\nCopyright ${new Date().getFullYear()} Spokestack\n`

// Write a pretty version
write(
  '../README.md',
  prettier.format(data, { ...pkg.prettier, parser: 'markdown' })
)
