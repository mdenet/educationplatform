const path = require('path');

module.exports = {
  mode: "development",
  devtool: "inline-source-map",

  entry: {
	 main: './src/Playground.js',
  },

  resolve: {
    alias: {
      'xtext/xtext-ace$': path.resolve(__dirname, 'src/xtext/2.31.0/xtext-ace'),
      'ace/range$': 'ace-builds/src-noconflict/ace',
    }
  },

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/js'),
    clean: true,
  },
};
