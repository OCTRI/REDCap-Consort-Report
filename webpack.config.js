const path = require('path');
const webpack = require('webpack');

const packageJson = require('./package.json');
const repoInfo = require('git-repo-info')();

const { DefinePlugin } = webpack;
const { VueLoaderPlugin } = require('vue-loader');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const buildEnv = process.argv.includes('--mode=production') ? 'production' : 'development';
const devMode = buildEnv === 'development';

module.exports = {
  externals: {
    jquery: 'jQuery'
  },
  entry: {
    app: [
      './js/main.js'
    ]
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'js')
    },
    extensions: ['.js', '.vue', '.json']
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'assets/bundle.[chunkhash].js',
    library: 'ReportCounts'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      },
      {
        test: /\.css$/,
        use: [devMode ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        loader: 'file-loader',
        options: {
          name: 'assets/[name].[hash].[ext]'
        }
      }
    ]
  },
  devtool: 'cheap-source-map',
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(buildEnv),
      REPORT_COUNTS_VERSION: JSON.stringify(packageJson.version),
      REPORT_COUNTS_GIT_HASH: JSON.stringify(repoInfo.abbreviatedSha)
    }),
    new VueLoaderPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        '*.md',
        'LICENSE',
        'index.php',
        'ReportCounts.php',
        'config.json',
        'lib/**/*.php'
      ]
    }),
    new HtmlWebpackPlugin({
      template: 'lib/main.tmpl',
      filename: 'lib/main.php',
      hash: false,
      inject: false
    }),
    new MiniCssExtractPlugin({
      filename: devMode ? 'assets/report-counts.css' : 'assets/report-counts.[contenthash].css',
      chunkFilename: devMode ? '[id].css' : '[id].[hash].css'
    })
  ]
};
