import * as AWS from "aws-sdk";
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const path = require("path");

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

  try {
    const {
      stderr,
    } = await exec(
      "docker run -v ~/ec2-audiowmark-test/src/data:/data --rm -i audiowmark add test.wav test-out.wav 0123456789abcdef0011223344556677",
      { cwd: path.resolve(process.cwd(), '../audiowmark') }
    );

    if (path.existsSync("data/test-out.wav")) {
			logs.push({ message: 'success', timestamp: new Date().getTime() })
    } else {
      throw stderr;
    }
  } catch (error) {
    logs.push({ message: error, timestamp: new Date().getTime() })
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
