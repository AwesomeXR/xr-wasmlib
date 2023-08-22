const cwd = process.cwd();

module.exports = {
  entry: {
    // XRSecurity: './ts/XRSecurity.ts',
    // AlemabicHelper: './ts/AlemabicHelper.ts',
    // CCUtil: './ts/CCUtil.ts',
    Basisu: './src/Basisu.ts',
  },

  mode: 'production',
  devtool: false,

  output: {
    path: cwd + '/dist',
    library: { type: 'umd' },
    globalObject: 'this',
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: cwd + '/tsconfig.json',
            },
          },
        ],
      },
    ],
  },

  plugins: [],

  resolve: {
    extensions: ['.ts', '.js'],
    fallback: { crypto: false, path: false, fs: false },
  },

  stats: {
    children: true,
  },
};
