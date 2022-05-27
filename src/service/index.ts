import * as AWS from "aws-sdk";
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const path = require("path");
const fs = require("fs");

const cloudwatchLogs = new AWS.CloudWatchLogs({
  apiVersion: "2014-03-28",
  region: "us-east-1",
});

const main = async () => {
  const logGroupName = process.env.LOG_GROUP_NAME! || "test";
  const logStreamName = `leaklock/ec2-audiowmark-test/${new Date().getTime()}`;

  await cloudwatchLogs
    .createLogStream({
      logGroupName,
      logStreamName,
    })
		.promise();
		
	const logs = []

	logs.push({ message: 'main started', timestamp: new Date().getTime() })

	logs.push({ message: JSON.stringify(process.env, null, 4), timestamp: new Date().getTime() })

	logs.push({ message: `path cwd ${process.cwd()}`, timestamp: new Date().getTime() })

	const dataPath = path.resolve('../ec2-audiowmark-test/dist/data')

	logs.push({ message: `data ${dataPath}`, timestamp: new Date().getTime() })

  try {
    const {
      stdout, stderr,
    } = await exec(
      `docker run -v ${dataPath}:/data --rm -i audiowmark add test.wav test-out.wav 0123456789abcdef0011223344556677`,
      { cwd: '../audiowmark' }
		);

		logs.push({ message: `stdout ${JSON.stringify(stdout, null, 4)}`, timestamp: new Date().getTime() })
		logs.push({ message: `stderr ${JSON.stringify(stderr, null, 4)}`, timestamp: new Date().getTime() })
		
		fs.access('../data/test-out.wav', fs.constants.R_OK, (error: any) => {
			if (error) throw error

			logs.push({ message: 'success', timestamp: new Date().getTime() })
		});
		
  } catch (error) {
    logs.push({ message: JSON.stringify(error, null, 4), timestamp: new Date().getTime() })
	}
	
	await cloudwatchLogs
		.putLogEvents({
			logGroupName,
			logStreamName,
			logEvents: logs,
		})
		.promise();

  return;
};

main();
