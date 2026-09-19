import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const directory = import.meta.dir;
const composeEnvironmentPath = join(directory, ".env");
const agentEnvironmentPath = join(directory, ".env.flemme-agent");

function secret() {
	return randomBytes(32).toString("hex");
}

async function createPrivateFile(path: string, contents: string) {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, contents, {
		encoding: "utf8",
		flag: "wx",
		mode: 0o600,
	});
}

await createPrivateFile(
	composeEnvironmentPath,
	[
		"LENS_VERSION=0.13.0",
		"PUBLIC_APP_URL=http://127.0.0.1:18080",
		"WEB_ORIGIN=http://127.0.0.1:18080",
		`POSTGRES_PASSWORD=${secret()}`,
		`CLICKHOUSE_PASSWORD=${secret()}`,
		`REDIS_PASSWORD=${secret()}`,
		`BETTER_AUTH_SECRET=${secret()}`,
		`INGESTION_KEY_PEPPER=${secret()}`,
		"",
	].join("\n"),
);

await createPrivateFile(
	agentEnvironmentPath,
	[
		"ANVIA_LENS_BASE_URL=http://127.0.0.1:18080",
		"ANVIA_LENS_PUBLIC_KEY=",
		"ANVIA_LENS_SECRET_KEY=",
		"ANVIA_LENS_SERVICE_NAME=flemme-agent",
		"ANVIA_LENS_ENVIRONMENT=local",
		"",
	].join("\n"),
);

console.log("Created ignored Lens environment files with mode 0600.");
