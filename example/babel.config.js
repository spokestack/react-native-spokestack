const path = require('path')
const pak = require('../package.json')

module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'transform-inline-environment-variables',
    'module:react-native-dotenv',
    [
      'module-resolver',
      {
        alias: {
          [pak.name]: path.join(__dirname, '..', pak.source)
        }
      }
    ]
  ]
}
