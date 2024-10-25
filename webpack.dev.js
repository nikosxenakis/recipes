/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
// const WebpackBundleAnalyzer = require('webpack-bundle-analyzer');

module.exports = merge(common, {
   mode: 'development',
   devtool: 'source-map',
   // plugins: [
   //    new WebpackBundleAnalyzer.BundleAnalyzerPlugin(),
   // ],
   devServer: {
      port: 3000,
      open: false,
      hot: true,
      historyApiFallback: { index: "/", disableDotRule: true },
   },
});
