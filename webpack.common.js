/* eslint-disable xss/no-mixed-html */
/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const path = require('path');
const dotenv = require('dotenv');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

dotenv.config();

module.exports = {
   entry: {
      index: path.join(__dirname, 'src', 'index.js'),
   },
   output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'docs'),
   },
   optimization: {
      minimizer: [
         new CssMinimizerPlugin()
      ]
   },
   module: {
      rules: [
         {
            test: /\.(woff|woff2|eot|ttf|otf)$/i,
            type: 'asset/resource',
            generator: {
               filename: '[name][ext]',
            },
         },
         {
            test: /\.(png|svg|jpg|gif)$/,
            use: ['file-loader'],
         },
         {
            test: /\.(s*)css$/,
            use: [MiniCssExtractPlugin.loader, "css-loader"]
         },
         {
            test: /\.(js|jsx)$/,
            exclude: /\.test\.(js|jsx)|node_modules$/,
            use: {
               loader: 'babel-loader',
            }
         },
         {
            test: /\.md$/,
            use: 'raw-loader'
         }
      ]
   },
   plugins: [
      new webpack.DefinePlugin({
         'process.env': JSON.stringify(process.env)
      }),
      new CopyPlugin({
         patterns: [
            {
               context: path.join(__dirname, 'src', 'assets', 'images'),
               from: "**/*",
               to: "assets/images/[path][name][ext]",
            },
         ],
      }),
      new CopyPlugin({
         patterns: [
            {
               context: path.join(__dirname, 'src', 'assets'),
               from: "**/*.md",
               to: "assets/[path][name][ext]",
            },
         ],
      }),
      new HtmlWebpackPlugin(
         {
            title: 'recipes',
            template: path.join(__dirname, 'public', 'index.html'),
            favicon: './src/assets/images/favicon.ico',
         },
      ),
      new MiniCssExtractPlugin({ filename: "assets/styles/[name].css" }),
   ],
   resolve: {
      extensions: ['.js', '.jsx'],
   },
};
