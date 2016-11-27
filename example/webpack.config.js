module.exports = {
	devtool: 'source-map',

	entry:  __dirname + "/src/main.js",
	output: {
		path: __dirname + "/public",
		filename: "main.js"
	},

	module: {
		loaders: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel',
				query: {
					presets: ['es2015', 'react']
				}
			}
		]
	},

	devServer: {
		contentBase: "./public",
		colors: true,
		historyApiFallback: true,
		inline: true
	}
}