/* eslint-disable */
var path = require('path')
require('dotenv').config()
var webpack = require('webpack')
var UglifyJsPlugin = require('uglifyjs-webpack-plugin')
var SshWebpackPlugin = require('ssh-webpack-plugin');

var plugins = [];

if (process.env.SSH_ENABLE) {
  // plugins.push(new SshWebpackPlugin({
  //   host: 'dev7.quartsoft.com',
  //   port: '61139',
  //   username: process.env.SSH_USER,
  //   password: process.env.SSH_PASSWORD,
  //   zip: false,
  //   from: './web/dist',
  //   to: process.env.SSH_DEST, //important: If the 'cover' of value is false,All files in this folder will be cleared before starting deployment.
  // }));
}

module.exports = {
    entry: {
        'cartogram': './client/cartogram',
        'gps': './client/gps',
        // 'videography-form': './client/videography-form',
    },
    output: {
        path: path.resolve(__dirname, 'web/dist'),
        publicPath: '/dist/',
        filename: '[name].js'
    },
    plugins,
    module: {
        rules: [
            /*{
                enforce: 'pre',
                test: /\.(js|vue)$/,
                loader: 'eslint-loader',
                exclude: /node_modules/,
            },*/
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    loaders: {
                        // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
                        // the "scss" and "sass" values for the lang attribute to the right configs here.
                        // other preprocessors should work out of the box, no loader config like this necessary.
                        'scss': [
                            'vue-style-loader',
                            'css-loader',
                            'sass-loader'
                        ],
                        'sass': [
                            'vue-style-loader',
                            'css-loader',
                            'sass-loader?indentedSyntax'
                        ]
                    }
                    // other vue-loader options go here
                }
            },
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    'style-loader',
                    'css-loader'
                ],
            },
            {
                test: /\.scss$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'sass-loader'
                ],
            },
            {
                test: /\.sass$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'sass-loader?indentedSyntax'
                ],
            },

            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]?[hash]'
                }
            }
        ]
    },
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.esm.js',
            '@app': path.resolve(__dirname, 'client'),
        },
        extensions: ['*', '.js', '.vue', '.json']
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true,
        overlay: true
    },
    performance: {
        hints: false
    },
    devtool: '#eval-source-map'
}

if (process.env.NODE_ENV === 'production') {
    module.exports.devtool = '#source-map'
    // http://vue-loader.vuejs.org/en/workflow/production.html
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new UglifyJsPlugin({
            uglifyOptions: {
                sourceMap: true,
                compress: {
                    warnings: false,
                }
            }
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ]);
}
