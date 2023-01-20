const path = require('path');

module.exports = {
  mode: "development",
  devtool: "inline-source-map",

  entry: {
	 main: './src/Playground.js',
  },

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/js'),
    clean: true,
  },
};
