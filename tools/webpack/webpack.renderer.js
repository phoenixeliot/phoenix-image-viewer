const rules = require("./webpack.rules");
const plugins = require("./webpack.plugins");

const webpackConfig = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    alias: {
      // Custom Aliases
      ...require("./webpack.aliases"),
    },
  },
  stats: "minimal",
  /**
   * Fix: Enable inline-source-map to fix following:
   * Dev tools: unable to load source maps over custom protocol
   */
  devtool: "inline-source-map",
};

// console.dir({ rendererWebpackConfig: webpackConfig }, { depth: null });

module.exports = webpackConfig;
