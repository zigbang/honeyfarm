const path = require("path")
const { config } = require('./wdio.app.conf')

config.specs = [
  './src/example_testcase.ts'
]

config.capabilities = [
  {
    platformName: 'iOS',
    maxInstances: 1,
    'appium:deviceName': 'iPhone X',
    'appium:platformVersion': '11.4',
    'appium:orientation': 'PORTRAIT',
    'appium:automationName': 'XCUITest',
    'appium:app': path.join(process.cwd(), "../testrunner/res/TestProject.app"),
    'appium:default': true,
    'appium:newCommandTimeout': 360,
    'appium:autoAcceptAlerts': true,
  }
]

// Capabilities above is only for simulators *ONLY*
// Check http://appium.io/docs/en/drivers/ios-xcuitest-real-devices/ for setting real-device capabilities.

config.logLevel = "debug"
exports.config = config
