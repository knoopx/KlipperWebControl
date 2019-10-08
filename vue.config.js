const ZipPlugin = require("zip-webpack-plugin");

module.exports = {
  configureWebpack: {
    performance: { hints: false },
    plugins: [
      new ZipPlugin({
        filename: "KlipperWebControl.zip",
      })
    ]
  },
  chainWebpack: config => {
    config.optimization.delete("splitChunks");
  }
};
