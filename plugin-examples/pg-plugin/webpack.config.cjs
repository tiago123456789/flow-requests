const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  mode: "production",
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
    library: "PostgresNode",
    libraryTarget: "umd",
    // execute() (the only place using a native import()) never runs in the
    // browser; this just allows webpack to preserve the Deno remote import.
    environment: {
      dynamicImport: true,
    },
  },
};
