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

	logs.push({ message: `dirname ${__dirname}`, timestamp: new Date().getTime() })

	const dataPath = path.resolve(__dirname, 'dist/data')

	logs.push({ message: `data ${dataPath}`, timestamp: new Date().getTime() })

	const cwdPath = path.resolve(__dirname, '../audiowmark')

	logs.push({ message: `cwd ${cwdPath}`, timestamp: new Date().getTime() })

	const outPath = path.resolve(dataPath, "test-out.wav")

	logs.push({ message: `out ${cwdPath}`, timestamp: new Date().getTime() })

  try {
    const {
      stderr,
    } = await exec(
      `docker run -v ${dataPath}:/data --rm -i audiowmark add test.wav test-out.wav 0123456789abcdef0011223344556677`,
      { cwd: cwdPath }
    );

    if (path.existsSync(outPath)) {
			logs.push({ message: 'success', timestamp: new Date().getTime() })
    } else {
      throw stderr;
    }
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
