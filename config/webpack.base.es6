'use strict'

const path = require('path')
const app_path = path.join(__dirname, '..') // Относительно файла конфигурации webpack
const webpack = require('webpack')
const resolved_module_extensions = ['.es6', '.js', '.json', '.jsx', '.es6.jsx', '.scss']
const resolve_paths = [
  path.join(app_path, './client/assets/stylesheets'),
  path.join(app_path, './node_modules')
]


module.exports = {

  devServer: {
    hot: true,
    contentBase: './'
  },
  devtool: 'eval',

  entry: [
    path.join(__dirname, '../client/index.es6.jsx')
  ],

  //
  output: {
    path: path.join(__dirname, '../public'),
    filename: 'bundle.js',
    publicPath: '/'
  },

  //
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ],

  //
  resolve: {
    alias: {
    },
    // require() file without adding .jsx and .js .suffix
    extensions: resolved_module_extensions,
    modules: resolve_paths
  },

  module: {
    rules: [
      {
        // JavaScript && React
        test: /\.jsx?$|\.es6$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        include: app_path,
        query: {
          presets: [ 'react-hmre', "env", "stage-0", "react" ],
          plugins: [ "transform-decorators-legacy" ],
        },
      },
      // Images
      // Inline base64 URLs for <=8k images, direct URLs for the rest
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        loader: 'url-loader',
        query: {
          limit: 8192,
          name: 'images/[name].[ext]?[hash]'
        }
      },
      // Fonts
      {
        test: /\.(woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader',
        query: {
          limit: 8192,
          name: 'fonts/[name].[ext]?[hash]'
        }
      }
    ]
  },
  // Фикс бага Module not found: Error: Cannot resolve module 'fs'
  node: {
    fs: "empty"
  }
}
