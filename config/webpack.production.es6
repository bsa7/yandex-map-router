'use strict'
const config = require('./webpack.base.es6')
const path = require('path')
const merge = require('webpack-merge')
const webpack = require('webpack')

const production_config = merge([config, {
  cache: true,
  devtool: false,
  output: {
    path: path.join(__dirname, '../public'),
    filename: 'bundle.js',
    publicPath: '../public/'
  },
  module: {
    rules: [
      {
        test: /\.es6$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: [
            ['env', { loose: true, modules: false }]
          ],
        },
      },
      // SCSS
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'resolve-url-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      // CSS
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: "css-loader",
            options: {
              modules: true,
              sourceMap: true,
              importLoaders: 1,
              localIdentName: "[name]--[local]--[hash:base64:8]"
            }
          },
          "postcss-loader"
        ]
      },
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: true
      },
      sourceMap: true,
    }),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    })
  ]
}])

module.exports = production_config
