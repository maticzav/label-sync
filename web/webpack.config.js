const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')

module.exports = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin({}),
    new ManifestPlugin(),
    new HtmlWebpackPlugin({
      title: 'Github LabelSync - The best way to sync labels',
      meta: [
        {
          name: 'og:title',
          content: 'Github LabelSync',
        },
        {
          name: 'og:type',
          content: 'website',
        },
        {
          name: 'og:url',
          content: 'https://labelsync.com',
        },
        {
          name: 'og:image',
          content: 'https://labelsync.com/assets/thumbnail.png',
        },
        {
          name: 'description',
          content: 'Managing Github labels is hard. LabelSync makes it easy.',
        },
      ],
      links: [
        'https://fonts.googleapis.com/css?family=Roboto',
        {
          href: '/apple-touch-icon.png',
          rel: 'apple-touch-icon',
          sizes: '180x180',
        },
        {
          href: '/favicon-32x32.png',
          rel: 'icon',
          sizes: '32x32',
          type: 'image/png',
        },
      ],
      devServer: 'http://localhost:3001',
      mobile: true,
      lang: 'en-US',
      template: require('html-webpack-template'),
      googleAnalytics: {
        trackingId: 'UA-104411218-2',
        pageViewOnLoad: true,
      },
    }),
  ],
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
}
