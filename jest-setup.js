/* global jest:false */
const { NativeModules } = require('react-native')

NativeModules.Spokestack = {
  initialize: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  activate: jest.fn(),
  deactivate: jest.fn(),
  synthesize: jest.fn(),
  speak: jest.fn(),
  classify: jest.fn()
}
