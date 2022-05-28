const util = require("util");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs");

const main = async () => {
	try {
		fs.access('data/test.wav', fs.constants.R_OK, (error: any) => {
			if (error) throw error

			console.log('test.wav is readable')

			return
		});

    const output = await exec('docker run -v /home/ubuntu/ec2-audiowmark-test/data:/data --rm -i audiowmark add test.wav test-out.wav 0123456789abcdef0011223344556677');

		console.log(JSON.stringify(output, null, 4))
		
		fs.access('data/test-out.wav', fs.constants.R_OK, (error: any) => {
			if (error) throw error

			return
		});

  } catch (error) {
    console.log(JSON.stringify(error, null, 4))
	}

  return;
};

main();
