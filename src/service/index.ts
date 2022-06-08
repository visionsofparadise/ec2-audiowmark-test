import * as AWS from "aws-sdk";
const fs = require("fs");
const { spawn } = require("child_process");

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

  const logs = [];

  logs.push({ message: "main started", timestamp: new Date().getTime() });

  try {
    const process = spawn("docker", [
      "run",
      "-v",
      '"$(pwd)"/data:/data',
      "--rm",
      "-i",
      "audiowmark",
      "add",
      "-",
      "-",
      "0123456789abcdef0011223344556677",
    ]);

    const readStream = fs.createReadStream("data/test.wav");
    const writeStream = fs.createWriteStream("data/test-output.wav");

    readStream.pipe(process.stdin);
    process.stdout.pipe(writeStream);

    process.on("error", (error: any) => {
      throw error;
    });

    process.on("close", (code: any) => {
      logs.push({ message: `code ${code}`, timestamp: new Date().getTime() });

      fs.access("data/test-out.wav", fs.constants.R_OK, (error: any) => {
        if (error) throw error;

        logs.push({ message: "success", timestamp: new Date().getTime() });

        return;
      });
    });
  } catch (error) {
    logs.push({
      message: JSON.stringify(error, null, 4),
      timestamp: new Date().getTime(),
    });
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
