module.exports = {
  plugins: [
    require('postcss-smart-import')({ /* ...options */ }),
    require('postcss-css-variables')(),
      require('postcss-cssnext')({
        features: {
          customProperties: false
        }
      }),
      require('postcss-responsive-type')()
  ]
}
