module.exports = {
  lintOnSave: false,
  devServer: {
    disableHostCheck: true,
    proxy: process.env.PROXY,
  },
  baseUrl: ''
}
