var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'js/bundle.js',
        path: path.resolve(__dirname, "dist")
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                    fallbackLoader: 'style-loader',
                    loader: [
                        {
                            loader: 'css-loader',
                            query: {
                                modules: false,
                                sourceMaps: true
                            }
                        },
                        'postcss-loader'
                    ]
                })
            }, {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }, {
                test: /\.(glsl|frag|vert)$/,
                loader: 'raw-loader',
                exclude: /node_modules/
            }, {
                test: /\.(glsl|frag|vert)$/,
                loader: 'glslify',
                exclude: /node_modules/
            }
        ]
    },
    devtool: 'source-map',
    plugins: [
        new ExtractTextPlugin({filename: 'css/bundle.css', disable: false, allChunks: true}),
        new HtmlWebpackPlugin({filename: 'index.html', template: 'index.html', inject: true})
    ]
}
