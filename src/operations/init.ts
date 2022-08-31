import path from "path";
import fs from "fs";
import fg from "fast-glob";
import mkdirp from "mkdirp";
import { global_ignone_glob } from "../constants";
import { runCommand } from "../helpers/RunCommand";
const run = async function cli() {
  console.info("creating a new app");

  const sample_folder = path.join(__dirname, "..", "..", "sample");
  const target_folder = process.cwd();
  console.info("template", sample_folder);
  console.info("target folder", target_folder);

  const items = await fg(
    ["**/*.ejs", "**/*.ts", "**/*.yaml", "**/*.json", "**/.gitignore", "**/.dockerignore", "**/.jsx", "**/.tsx"],
    {
      cwd: sample_folder,
      ignore: [...global_ignone_glob, "**/package-lock.json"],
    }
  );

  items
    .map((item) => {
      return {
        src: item,
        src_full_path: path.join(sample_folder, item),
        target_full_path: path.join(target_folder, item),
      };
    })
    .forEach((item) => {
      console.info("COPY", item.src);
      const directory = path.dirname(item.target_full_path);

      if (fs.existsSync(item.target_full_path)) {
        console.info("ignoring", item.src, "because", "already exists");
        return;
      }
      if (!fs.existsSync(directory)) {
        mkdirp.sync(directory);
      }

      fs.copyFileSync(item.src_full_path, item.target_full_path);
    });

  await runCommand("npm install", target_folder);

  console.info("create complete");
};

run().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
