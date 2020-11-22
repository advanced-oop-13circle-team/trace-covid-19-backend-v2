module.exports = {
	apps: [
		{
			name: "trace-covid-19-backend-v2",
			script: "./bin/www",
			instances: 0,
			exec_mode: "cluster",
			log: "logs/trace-covid-19.log",
			merge_logs: true,
			time: true,
		},
	],
};
