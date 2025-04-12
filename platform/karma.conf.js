// Karma configuration
// Generated on Fri Jan 27 2023 10:15:56 GMT+0000 (Greenwich Mean Time)
const path = require('path');

module.exports = function(config) {
  config.set({

    plugins: [
        require('karma-webpack'),
        require('karma-coverage'),
        require('karma-jasmine'),
        require('karma-chrome-launcher'),
        require("karma-firefox-launcher"),
        require("karma-edgium-launcher"),
        require("karma-safarinative-launcher"),
        require('karma-jasmine-html-reporter'),
        require('karma-junit-reporter')
    ],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://www.npmjs.com/search?q=keywords:karma-adapter
    frameworks: ['jasmine', 'webpack'],


    // list of files / patterns to load in the browser
    files: [
      'test/spec/**/*Spec.js'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://www.npmjs.com/search?q=keywords:karma-preprocessor
    preprocessors: {
        'src/**/*.js' : ['webpack'],
        'test/spec/**/*Spec.js' : ['webpack']
    },
    
    webpack: { 
      /* This webpack configuration is just for running unit tests
         see the webpack.config.js in the main directory for deployment. */

    /* ---------- WEBPACK CONFIG DEV - START ------------ */
      mode: "development",
      devtool: "inline-source-map",

      resolve: {
        alias: {
          'xtext/xtext-ace$': path.resolve(__dirname, 'src/xtext/2.31.0/xtext-ace'),
          'ace/range$': 'ace-builds/src-noconflict/ace',
        }
      },

      module: {
        rules: [
          {
            test: /\.(?:js|mjs|cjs)$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', { targets: "defaults" }]
                ],
                plugins: ["babel-plugin-istanbul"]
              }
            }
          }
        ]
    }
    /* ---------- WEBPACK CONFIG DEV - END ------------ */
    },
    
    webpackMiddleware: { 
        noInfo: true
    },
    
    
    // list of files / patterns to exclude
    exclude: [
    ],



    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://www.npmjs.com/search?q=keywords:karma-reporter
    reporters: ['kjhtml','progress','junit', 'coverage'], 


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://www.npmjs.com/search?q=keywords:karma-launcher
    browsers: ['ChromeHeadless','FirefoxHeadless'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser instances should be started simultaneously
    concurrency: 25,
    
    junitReporter: {
      outputDir: 'reports', // results will be saved as $outputDir/$browserName.xml
      outputFile: undefined, // if included, results will be saved as $outputDir/$browserName/$outputFile
      suite: '', // suite will become the package name attribute in xml testsuite element
      useBrowserName: true, // add browser name to report and classes names
      nameFormatter: undefined, // function (browser, result) to customize the name attribute in xml testcase element
      classNameFormatter: undefined, // function (browser, result) to customize the classname attribute in xml testcase element
      properties: {}, // key value pair of properties to add to the <properties> section of the report
      xmlVersion: null // use '1' if reporting to be per SonarQube 6.2 XML format
    },
    
    coverageReporter: {
      dir : 'reports/',
      reporters:[
        { type: 'html', subdir: 'coverage-report-html' },
        { type: 'lcovonly', subdir: '.', file: 'coverage-report.lcov' },
        { type: 'cobertura', subdir: '.', file: 'coverage-report.xml' },
        { type: 'text', subdir: '.', file: 'coverage-report.txt' },
        { type: 'text-summary', subdir: '.', file: 'coverage-summary.txt' },
      ],
      includeAllSources: true
    }
    
  });
}
