import { spawn } from 'node:child_process';
import fs from 'node:fs'
import path from 'node:path'
import process from  'node:process'

const OUT_PATH = "./out"

if (!fs.existsSync(OUT_PATH)) {
	fs.mkdirSync(OUT_PATH)
}

fs.readdir("./posts", {withFileTypes: true}, (err, entries) => {
	if (err) {
		console.error("error fetching from ./posts");
		process.exit(1);
	}
	Promise.all(entries
		.filter(entry => entry.isFile())
		.filter(entry => entry.name.endsWith(".cow"))
		.map(entry => {
			const file = path.join("./posts", entry.name);
			const output = path.join(OUT_PATH, entry.name.replace(".cow", ".html"));
			return new Promise((resolve, reject) => {
				const cowelProcess = spawn("cowel", ["run", file, output])
				cowelProcess.stderr?.pipe(process.stderr);
				cowelProcess.stdout?.pipe(process.stdout);

				cowelProcess.on('error', (err) => {
					reject();
					throw err;
				})

				cowelProcess.on('exit', (code, signal) => {
					resolve(code);
				})
			})
		})
	).then(() => {
		console.log("build finished");
	})
})