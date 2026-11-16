import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { features } from "./jdk21-content.mjs";

const javaExamples = features.filter((feature) => feature.lang === "java");
const results = [];

for (const feature of javaExamples) {
  const directory = await mkdtemp(join(tmpdir(), "jdk21-example-"));
  const source = join(directory, feature.filename);
  await writeFile(source, feature.code, "utf8");

  const args = ["-d", directory];
  if (feature.status === "PREVIEW" || feature.status === "INCUBATOR") {
    args.push("--enable-preview", "--release", "21");
  } else {
    args.push("--release", "21");
  }
  if (feature.slug === "vector-api") {
    args.push("--add-modules", "jdk.incubator.vector");
  }
  args.push(source);

  const process = spawnSync("javac", args, { encoding: "utf8" });
  results.push({
    chapter: `${String(feature.order).padStart(2, "0")} ${feature.title}`,
    file: feature.filename,
    ok: process.status === 0,
    error: process.status === 0 ? "" : (process.stderr || process.stdout).trim()
  });
  await rm(directory, { recursive: true, force: true });
}

for (const result of results) {
  console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.chapter}  (${result.file})`);
  if (!result.ok) console.log(result.error);
}

const failed = results.filter((result) => !result.ok);
if (failed.length) {
  process.exitCode = 1;
}
