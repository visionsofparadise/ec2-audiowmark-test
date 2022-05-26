import * as AWS from "aws-sdk";
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const path = require("path");
import * as express from "express";
import * as cors from "cors";
import * as bodyParser from "body-parser";

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

  const log = async (message: string) => {
    console.log(message);

    return cloudwatchLogs
      .putLogEvents({
        logGroupName,
        logStreamName,
        logEvents: [
          {
            timestamp: new Date().getTime(),
            message,
          },
        ],
      })
      .promise();
  };

  await log("main started");

  const api = express();

  api.use(cors());
  api.use(bodyParser.urlencoded({ extended: true }));
  api.use(bodyParser.json());

  api.get("/", async (_, res) => res.sendStatus(200));

  api.listen(4000, async () => log("api started"));

  try {
    const {
      stderr,
    } = await exec(
      "docker run -v ~/ec2-audiowmark-test/data:/data --rm -i audiowmark add test.wav test-out.wav 0123456789abcdef0011223344556677",
      { cwd: "~/audiowmark" }
    );

    if (path.existsSync("data/test-out.wav")) {
      await log("success");
    } else {
      throw stderr;
    }
  } catch (error) {
    await log(error);
  }

  return;
};

main();
