const webpack = require('webpack');
const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { opendirSync } = require('fs');

const srcPath = 'src';
const articlesPath = 'articles';

const articlesDir = opendirSync(path.resolve(process.cwd(), srcPath, articlesPath));
const articlePages = {};
for (let articlePage = articlesDir.readSync(); articlePage != null; articlePage = articlesDir.readSync()) {
  articlePages[articlePage.name] = {
    import: `./${srcPath}/${articlesPath}/${articlePage.name}/index.ts`
  };
}

let entries = Object.assign({
  index: './src/index.ts'
}, articlePages);

function queryStringToJSON(queryString) {
  let result = {};
  if (!queryString)
    return result;
  if (queryString.indexOf('?') > -1) {
    queryString = queryString.split('?')[1];
  }
  var pairs = queryString.split('&');

  pairs.forEach(function (pair) {
    pair = pair.split('=');
    result[pair[0]] = decodeURIComponent(pair[1] || '');
  });
  return result;
}

module.exports = {
  mode: 'development',
  entry: entries,
  plugins: [
    new OptimizeCssAssetsPlugin(),
    new CleanWebpackPlugin({
      output: {
        path: path.resolve(process.cwd(), 'dist'),
      }
    }),
    new webpack.ProgressPlugin(),
    new MiniCssExtractPlugin({ filename: 'main.css' }),
    new CopyPlugin([
      { from: 'src/dist/', to: './' },
    ]),
  ],

  module: {
    rules: [
      {
        test: /.(js)?$/,
        loader: 'script-loader',
        include: [],
        exclude: [/node_modules/]
      },
      {
        test: /.(ts|tsx)?$/,
        loader: 'ts-loader',
        include: [],
        exclude: [/node_modules/]
      },
      {
        test: /.(css)$/,
        use: [{
          loader: 'file-loader',
          options: {
            esModule: false,
            publicPath: './',
          }
        },
          'extract-loader',
        {
          loader: "css-loader",
          options: {
            sourceMap: false
          }
        }
        ]
      },
      {
        test: /.(less)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: 'main.css',
            esModule: false,
            publicPath: './',
          }
        },
          'extract-loader',
        {
          loader: "css-loader",
          options: {
            sourceMap: false
          }
        },
        {
          loader: "less-loader",
          options: {
            sourceMap: true
          }
        }]
      },
      {
        test: /\.pug$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name(_, resourceQuery) {
                const queryStringParsed = queryStringToJSON(resourceQuery);
                let res = (!!queryStringParsed.articleName && `${queryStringParsed.articleName}.html`) || '[name].html';
                console.log(res);
                return res;
              },
              publicPath: './'
            }
          },
          'extract-loader',
          {
            loader: "html-loader",
            options: {
              attrs: ["img:src", "link:href"],
              publicPath: './'
            }
          },
          'pug-html-loader'
        ]
      },
      {
        test: /\.(svg|jpe?g|woff(2)?|ttf|eot)/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'static/[hash].[ext]',
              esModule: false,
              publicPath: './'
            }
          }
        ]
      }
    ]
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },

  optimization: {
    minimizer: [new TerserPlugin()],
  }
}
