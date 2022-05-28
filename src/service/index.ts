import * as AWS from "aws-sdk";
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs");

const cloudwatchLogs = new AWS.CloudWatchLogs({
  apiVersion: "2014-03-28",
  region: "us-east-1",
});

const main = async () => {
  const logGroupName = process.env.LOG_GROUP_NAME!;
  const logStreamName = `leaklock/ec2-audiowmark-test/${new Date().getTime()}`;

  await cloudwatchLogs
    .createLogStream({
      logGroupName,
      logStreamName,
    })
		.promise();
		
	const logs = []

	logs.push({ message: 'main started', timestamp: new Date().getTime() })

	try {
		fs.access('data/test.wav', fs.constants.R_OK, (error: any) => {
			if (error) throw error

			logs.push({ message: 'test.wav is readable', timestamp: new Date().getTime() })

			return
		});

    const output = await exec('docker run -v /home/ubuntu/ec2-audiowmark-test/data:/data --rm -i audiowmark add test.wav test-out.wav 0123456789abcdef0011223344556677');

		logs.push({ message: `output ${JSON.stringify(output, null, 4)}`, timestamp: new Date().getTime() })
		
		fs.access('data/test-out.wav', fs.constants.R_OK, (error: any) => {
			if (error) throw error

			logs.push({ message: 'success', timestamp: new Date().getTime() })

			return
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
