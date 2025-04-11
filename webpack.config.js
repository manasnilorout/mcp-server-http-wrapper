const path = require('path');
const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  optimization: {
    minimize: false, // We don't need to minimize our Lambda code
  },
  performance: {
    hints: false, // Turn off size warnings for entry points
  },
  devtool: 'source-map',
  externals: [nodeExternals()], // Exclude node_modules
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
    sourceMapFilename: '[file].map',
  },
  // Copy the mcp_servers directory
  plugins: [
    new (require('copy-webpack-plugin'))({
      patterns: [
        { 
          from: 'mcp_servers', 
          to: 'mcp_servers',
          noErrorOnMissing: true
        }
      ]
    })
  ]
}; 