/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const TerserPlugin = require( 'terser-webpack-plugin' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const path = require( 'path' );
const webpack = require( 'webpack' );

/**
 * @type TerserPlugin.TerserPluginOptions[ 'terserOptions' ]
 */
const terserOptions = {
  compress: {
    arguments: true,
    booleans_as_integers: true,
    drop_console: true,
    keep_fargs: false,
    passes: 2,
    unsafe_arrows: true,
    unsafe_math: true,
    unsafe_symbols: true,
  },
  mangle: {
    properties: {
      regex: /.+/,
      keep_quoted: true,
      reserved: [
        // material tags
        'forward',
        'deferred',
        'depth',
      ]
    },
  },
  format: {
    ascii_only: true,
    ecma: 2020,
  },
  module: true,
  toplevel: true,
};

module.exports = ( env, argv ) => {
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
          test: /\.js$/,
          enforce: 'pre',
          use: [ 'source-map-loader' ],
        },
        {
          test: /automaton\.json$/,
          use: [
            {
              loader: path.resolve( __dirname, './loaders/automaton-json-loader.js' ),
              options: {
                minimize: DEV ? false : {
                  precisionTime: 3,
                  precisionValue: 3,
                }
              }
            },
          ],
          type: 'javascript/auto',
        },
        {
          test: /\.(glsl|frag|vert)$/,
          type: 'asset/source',
        },
        {
          test: /\.(opus|png)$/,
          type: 'asset/inline',
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
      minimizer: [ new TerserPlugin( { terserOptions } ) ],
      moduleIds: DEV ? 'named' : undefined,
      usedExports: !DEV,
    },
    devServer: {
      hot: true
    },
    devtool: DEV ? 'inline-source-map' : 'source-map',
    plugins: [
      new webpack.DefinePlugin( {
        'process.env': {
          DEV,
        },
      } ),
      new HtmlWebpackPlugin(),
    ],
  };
};
