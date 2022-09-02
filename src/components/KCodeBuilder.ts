import path from "path";
import fs from "fs";
import mkdirp from "mkdirp";
import rimraf from "rimraf";
import * as rollup from "rollup";
import rollupTs from "@rollup/plugin-typescript";
import { getBabelInputPlugin } from "@rollup/plugin-babel";
import rollupCommonjs from "@rollup/plugin-commonjs";
import rollupResolve from "@rollup/plugin-node-resolve";
import rollupPostcss from "rollup-plugin-postcss";
import crypto from "crypto";
import { KDispatcher } from "./KDispatcher";
import { KRouter } from "./KRouter";
export class KCodeBuilder {
  private cache_prefix = "/.cache";
  private readonly root_dir: string;
  private cache_dir: string;

  constructor(private readonly router: KRouter, private readonly dispatcher: KDispatcher) {
    this.root_dir = this.router.loader.routes_directory;

    this.cache_dir = path.join(this.root_dir, this.cache_prefix);
    if (fs.existsSync(this.cache_dir)) {
      rimraf.sync(this.cache_dir);
    }
    mkdirp.sync(this.cache_dir);
  }

  async buildReact(route_path: string, route_verb: string, entry_point_file: string, data?: object) {
    if (!fs.existsSync(entry_point_file)) {
      throw new Error("EntryPoint Not found " + entry_point_file);
    }
    const build_extension = ".build";
    const cache_extension = ".cache";
    const temp_mark = ".k.tmp.to-delete";

    const entry_point_filename = path.basename(entry_point_file);
    const entry_point_filename_without_ext = entry_point_filename
      .replace(path.extname(entry_point_filename), "")
      .trim();
    const entry_point_folder = path.dirname(entry_point_file);

    const data_hash = crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");

    const cache_folder = path.join(this.cache_dir, route_path, route_verb);
    const cache_filename = data_hash + temp_mark + cache_extension;
    const cache_file = path.join(cache_folder, cache_filename);

    if (fs.existsSync(cache_file)) {
      const cache_content = fs.readFileSync(cache_file, { encoding: "utf-8" });
      return cache_content;
    }

    const boot_file_path = path.join(entry_point_folder, "boot" + temp_mark + ".jsx");
    const temp_build_file = path.join(entry_point_folder, route_verb + temp_mark + build_extension);

    let body = "NO RESULT";

    try {
      let externalDependencies = ["react", "react-dom", "react-router-dom"];

      const boot_script = `import App from "./${entry_point_filename_without_ext}";
  import React from "react";
  import ReactDOM from "react-dom";
  const container = document.getElementById("root");  
  const datas = ${JSON.stringify(data)};
  ReactDOM.render(<App {...datas} />, container);`;
      fs.writeFileSync(boot_file_path, boot_script, { encoding: "utf-8" });

      const rolllup_build = await rollup.rollup({
        input: [boot_file_path],
        external: externalDependencies,
        plugins: [
          getBabelInputPlugin({
            presets: ["@babel/preset-env", "@babel/preset-react"],
            babelHelpers: "bundled",
          }),
          rollupResolve({ extensions: [".js", ".jsx", ".ts", ".tsx"] }),
          rollupCommonjs(),
          rollupTs({
            include: ["**/*.ts", "**/*.tsx"],
            sourceMap: true,

            compilerOptions: {
              module: "esnext",
              target: "es5",
              lib: ["es6", "dom"],
              sourceMap: true,
              jsx: "react",
              moduleResolution: "node",

              noImplicitReturns: true,
              noImplicitThis: true,
              noImplicitAny: true,
              strictNullChecks: true,
              esModuleInterop: true,
              forceConsistentCasingInFileNames: true,
            },
          }),
          rollupPostcss({ plugins: [] }),
        ],
      });

      const output = await rolllup_build.write({
        file: temp_build_file,
        format: "iife",
        sourcemap: "inline",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react-router-dom": "ReactRouterDOM",
        },
      });

      body = `<div id="root"></div>
<script crossorigin src="https://unpkg.com/react@17/umd/react.development.js">
</script><script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
<script src='https://unpkg.com/react-router-dom@5/umd/react-router-dom.min.js'></script>
<script src='https://unpkg.com/babel-standalone@6.26/babel.js'></script>
<script type="module">${output.output[0].code}</script>
`;
    } finally {
      if (fs.existsSync(boot_file_path)) fs.unlinkSync(boot_file_path);
      if (fs.existsSync(temp_build_file)) fs.unlinkSync(temp_build_file);
    }

    //Write cache
    if (!fs.existsSync(cache_folder)) {
      mkdirp.sync(cache_folder);
    }

    try {
      fs.writeFileSync(cache_file, body, { encoding: "utf-8" });
    } catch (e) {
      console.error(e);
    }

    return body;
  }
}
