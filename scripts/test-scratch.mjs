import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const temporaryDirectory = fileURLToPath(new URL("../.scratch/tmp/", import.meta.url));
mkdirSync(temporaryDirectory, { recursive: true });
process.env.TMPDIR = temporaryDirectory;
