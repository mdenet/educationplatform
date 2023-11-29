const path = require('path');
const { DefinePlugin } = require('webpack');

module.exports = (env) => {
  return {
    mode: "development",
    devtool: "inline-source-map",
    entry: './src/Playground.js',

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
    plugins: [
      new DefinePlugin({
        'TOKEN_SERVER_URL': JSON.stringify(env.tokenServerUrl),
      }),
    ]
  };
};
