/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const TerserPlugin = require( 'terser-webpack-plugin' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const packageJson = require( './package.json' );
const path = require( 'path' );
const webpack = require( 'webpack' );

module.exports = ( env, argv ) => {
  const VERSION = packageJson.version;
  const DEV = argv.mode === 'development';

  return {
    entry: path.resolve( __dirname, 'src/main.ts' ),
    output: {
      path: path.join( __dirname, 'dist' ),
      filename: 'bundle.js',
    },
    resolve: {
      extensions: [ '.js', '.ts' ],
    },
    module: {
      rules: [
        {
          test: /\.(glsl|frag|vert)$/,
          type: 'asset/source',
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            'ts-loader',
          ],
        },
      ],
    },
    optimization: {
      minimize: !DEV,
      minimizer: [ new TerserPlugin() ],
      moduleIds: DEV ? 'named' : undefined,
      usedExports: !DEV,
    },
    devServer: {
      inline: true,
      hot: true
    },
    devtool: DEV ? 'inline-source-map' : 'source-map',
    plugins: [
      new webpack.DefinePlugin( {
        'process.env': {
          DEV,
          VERSION: `"${ VERSION }"`
        },
      } ),
      new HtmlWebpackPlugin(),
    ],
  };
};
