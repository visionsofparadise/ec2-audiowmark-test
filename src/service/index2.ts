const util = require("util");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs");

const main = async () => {
	try {
    const output = await exec('./run.sh');

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
