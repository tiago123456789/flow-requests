const path = require("path");

module.exports = {
  entry: "./src/index.ts", // Your main entry file
  mode: "production", // Use 'development' for dev, 'production' for final output
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    library: "<CHANGE_VALE_HERE>",
    libraryTarget: "umd",
  },
};
