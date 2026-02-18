import path from 'node:path'
import { exists } from 'jsr:@std/fs@1.0.22/exists'

const OUT_PATH = "./out"

if (!await exists(OUT_PATH)) {
	Deno.mkdir(OUT_PATH)
}

const entries = await Array.fromAsync(Deno.readDir("./posts"));

const posts = await Promise.all(entries
	.filter(entry => entry.isFile)
	.filter(entry => entry.name.endsWith(".cow"))
	.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
	.reverse()
	.map(entry => {
		const file = path.join("./posts", entry.name);
		const output = path.join(OUT_PATH, entry.name.replace(".cow", ".html"));
		return new Promise<{ title: string, date: string, link: string }>
			((resolve, reject) => {
				const cowelCommand = new Deno.Command("cowel", {
					args: ["run", file, output],
					stderr: "null",
					stdout: "null",
				})
				const cowelProcess = cowelCommand.spawn();

				cowelProcess.ref();

				cowelProcess.status.then((status) => {
					if (status.success) {
						return;
					}
					reject();
				})

				cowelProcess.output().then(() => {
					const contents = Deno.readTextFileSync(output);
					const title = <string>contents.match(/<title>(.*)<\/title>/)?.[1];
					const date = <string>contents.match(/<div id=date>(.*)<\/div>/)?.[1];
					resolve({ title, date, link: entry.name.replace(".cow", ".html") });
				});
			})
	})
)
const index = `\
<p class="middle" style="font-size:3rem;font-weight:100;">Blog</p>
<div class="middle" id="projects-list" style="top:3rem;">${posts.map((post) =>
	`
	<div class="glass project">
		<p class="heading"><a href="${post.link}">${post.title}</a></p>
		<p>${post.date}</p>
	</div>`
).reduce((prev, current) => prev + current, "")
	}
</div>`

await Deno.writeTextFile(path.join(OUT_PATH, "out.html"), index);
await Deno.copyFile("404.html", path.join(OUT_PATH, "404.html"))

console.log("build finished");