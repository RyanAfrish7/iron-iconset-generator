const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    "app-main": './src/app-main.js'
  },
  devtool: 'source-map',
  devServer: {
    contentBase: 'build',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      inject: true,
      template: 'index.html'
    })
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: { 
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    "chrome": "70"
                  },
                  useBuiltIns: "usage",
                  modules: false,
                  corejs: 3
                }
              ]
            ],
          }
        },
      }
    ]
  },
  resolve: {
    modules: [ 'node_modules' ],
    extensions: [".js"],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build')
  }
};
