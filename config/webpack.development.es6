const path = require('path')
const merge = require('webpack-merge')
const config = require('./webpack.base.es6')
const resolve_paths = [
  path.join(__dirname, '../client/assets/images/interface_elements'),
  path.join(__dirname, '../client/assets/images'),
  path.join(__dirname, '../client/assets/stylesheets'),
  path.join(__dirname, '../client/assets'),
  path.join(__dirname, '../node_modules')
]
const resolved_module_extensions = ['.es6', '.js', '.json', '.jsx', '.scss']

const dev_config = merge([config, {
  cache: true,
  devServer: {
    hot: true,
    contentBase: './'
  },
  devtool: 'eval',
  entry: [
    'webpack-hot-middleware/client',
    path.join(__dirname, '../client/assets/stylesheets/index.scss'),
  ],
  resolve: {
    modules: resolve_paths,
    extensions: resolved_module_extensions
  },
  module: {
    rules: [
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
          'postcss-loader',
        ]
      },
    ]
  }
}])

module.exports = dev_config
