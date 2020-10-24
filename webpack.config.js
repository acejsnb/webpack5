const { resolve, join } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // 自动生成index.html
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 文本分离插件，分离js和css
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // 清理垃圾文件

const { VueLoaderPlugin } = require('vue-loader'); // vue加载器
const port = 3002;

/**
 * 判断是生产环境还是开发环境
 * @type {boolean}
 * isProd为true表示生产
 */
const isProd = process.env.NODE_ENV === 'production';

/**
 *  css和stylus开发、生产依赖
 *  生产分离css
 */
const cssConfig = [
    isProd ? MiniCssExtractPlugin.loader : 'vue-style-loader',
    {
        loader: 'css-loader',
        options: {
            sourceMap: !isProd
        }
    }
];

const config = {
    entry: {
        index: './src/index.js' // 入口文件
    },
    output: {
        path: resolve(__dirname, 'dist'),
        filename: isProd ? 'javascript/[name].[contenthash:5].js' : '[name].js', // [name] 是entry的key
        publicPath: isProd ? './' : '/'
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: cssConfig
            },
            {
                test: /\.vue$/,
                use: [
                    {
                        loader: 'vue-loader',
                        options: {
                            loaders: {
                                css: cssConfig
                            },
                            preserveWhitespace: false // 不要留空白
                        }
                    }
                ],
                include: [resolve(__dirname, 'src')]
            },
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: !isProd
                        }
                    }
                ],
                exclude: /node_modules/,
            },
            {
                test: /\.html$/,
                use: [{
                    loader: 'html-loader',
                    options: { // 配置html中图片编译
                        minimize: true,
                        attributes: false
                    }
                }]
            }
        ]
    },
    resolve: { // 配置路径别名
        extensions: ['.js', '.vue', '.styl'] // import引入文件的时候不用加后缀
    },
    plugins: [
        new VueLoaderPlugin(), // vue加载器
        new HtmlWebpackPlugin({
            template: join(__dirname, 'src/index.html'), // 引入模版
            filename: 'index.html',
            minify: { // 对index.html压缩
                collapseWhitespace: isProd, // 去掉index.html的空格
                removeAttributeQuotes: isProd // 去掉引号
            },
            hash: true, // 去掉上次浏览器的缓存（使浏览器每次获取到的是最新的html）
            inlineSource: '.(js|css)'
        }),
        new MiniCssExtractPlugin({ // 分离css
            filename: 'stylesheets/[name].[contenthash:5].css'
        })
    ]
};

if (isProd) {
    config.plugins.push(
        new CleanWebpackPlugin({
            verbose: true, // 打印被删除的文件
            protectWebpackAssets: false, // 允许删除cleanOnceBeforeBuildPatterns中的文件
            cleanOnceBeforeBuildPatterns: ['**/*', resolve(__dirname, 'dist')]
        }),
        new MiniCssExtractPlugin({ // 分离css
            filename: 'stylesheets/[name].[contenthash:5].css'
        })
    );
    config.optimization = { // 抽离第三方插件
        minimize: true,
        splitChunks: {
            chunks: 'all', // 必须三选一： "initial" | "all" | "async"(默认就是异步)
            minChunks: 3, // 共享最少的chunk数，使用次数超过这个值才会被提取
            maxAsyncRequests: 5, // 最多的异步chunk数
            maxInitialRequests: 5, // 最多的同步chunks数
            cacheGroups: { // 这里开始设置缓存的 chunks
                vendor: { // key 为entry中定义的 入口名称，new webpack.ProvidePlugin中的库
                    test: /node_modules/, // 正则规则验证，如果符合就提取 chunk (指定是node_modules下的第三方包)
                    // test: /[\\/]node_modules[\\/](vue|vue-router|vuex)[\\/]/, // 正则规则验证，如果符合就提取 chunk (指定是node_modules下的第三方包)
                    name: 'vendor', // 要缓存的 分隔出来的 chunk 名称
                    enforce: true,
                },
                main: {
                    test: /src/,
                    name: 'main',
                    enforce: true,
                }
            }
        },
        runtimeChunk: { name: 'runtime' } // 为每个入口提取出webpack runtime模块
    };
} else {
    config.plugins.push(
        new webpack.HotModuleReplacementPlugin(),
    );
    config.devtool = 'eval-source-map'; // 如果只用source-map开发环境出现错误定位源文件，生产环境会生成map文件
    config.devServer = {
        contentBase: join(__dirname, 'dist'), // 将 dist 目录下的文件，作为可访问文件。
        compress: true, // 开启Gzip压缩
        host: 'localhost', // 设置服务器的ip地址，默认localhost
        port, // 端口号
        open: true, // 自动打开浏览器
        hot: true,
        noInfo: true,
        overlay: { // 当出现编译器错误或警告时，就在网页上显示一层黑色的背景层和错误信息
            errors: true
        },
        disableHostCheck: true //  不检查主机
    };
}

module.exports = config;
