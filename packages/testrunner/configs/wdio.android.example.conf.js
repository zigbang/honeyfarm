const path = require("path")
const { config } = require('./wdio.app.conf')

config.specs = [
  './src/example_testcase.ts'
]

config.capabilities = [
  {
    platformName: 'android',
    maxInstances: 1,
    'appium:deviceName': 'uitest',
    'appium:platformVersion': '9',
    'appium:orientation': 'PORTRAIT',
    'appium:automationName': 'UiAutomator2',
    'appium:app': path.join(process.cwd(), "../testrunner/res/TestProject.apk"),
    'appium:default': true,
    'appium:newCommandTimeout': 360,
    "appium:autoGrantPermissions": true
  }
]

config.logLevel = "debug"
exports.config = config
