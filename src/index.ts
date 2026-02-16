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
		.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
		.reverse()
		.map(entry => {
			const file = path.join("./posts", entry.name);
			const output = path.join(OUT_PATH, entry.name.replace(".cow", ".html"));
			return new Promise<{title: string, date: string, link: string}>
				((resolve, reject) => {
				const cowelProcess = spawn("cowel", ["run", file, output])
				// cowelProcess.stderr?.pipe(process.stderr);
				// cowelProcess.stdout?.pipe(process.stdout);

				cowelProcess.on('error', (err) => {
					reject();
					throw err;
				})

				cowelProcess.on('exit', (code, signal) => {
					const contents = fs.readFileSync(output, { encoding: 'utf8' });
					const title = <string>contents.match(/<title>(.*)<\/title>/)?.[1];
					const date = <string>contents.match(/<div id=date>(.*)<\/div>/)?.[1];
					resolve({title, date, link: entry.name.replace(".cow", ".html")});
				})
			})
		})
	).then((posts) => {
		const index = `\
<p class="middle" style="font-size:3rem;font-weight:100;">Blog</p>
<div class="middle" id="projects-list" style="top:3rem;">${
	posts.map((post) =>
		`
	<div class="glass project">
		<p class="heading"><a href="${post.link}">${post.title}</a></p>
		<p>${post.date}</p>
	</div>`
	).reduce((prev, current) => prev + current, "")
}
</div>`
		fs.writeFileSync(path.join(OUT_PATH, 'out.html'), index, {encoding: 'utf8'})
		console.log("build finished");
	})
})