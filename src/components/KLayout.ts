import _ from "lodash";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import moment from "moment";
import { KRequest } from "./KRequest";
import * as rollup from "rollup";
import rollupTs from "@rollup/plugin-typescript";
import { getBabelInputPlugin } from "@rollup/plugin-babel";
import rollupCommonjs from "@rollup/plugin-commonjs";
import rollupResolve from "@rollup/plugin-node-resolve";
import rollupTerser from "rollup-plugin-terser";
export class KLayout {
  template_extension = ".ejs";
  private layout_dir: string;
  private readonly root_dir: string;
  private readonly module_dir: string;

  constructor(private readonly request: KRequest) {
    (this.root_dir = this.request.router.loader.routes_directory), (this.module_dir = this.request.route.folder);

    this.layout_dir = path.join(this.root_dir, "_layout");
  }

  render(view_name: string, data?: object) {
    const header = this._render_header();
    const body = this._render_body(view_name, data);
    const footer = this._render_footer();

    const html = header + body + footer;
    return html;
  }

  renderWelcome() {
    const welcome_view_path = path.join(this.layout_dir, "welcome.ejs");

    const manifests = this.request.router.manifests;
    const app = manifests.find((item) => item.metadata.kind === "app")?.body;

    const modules = _.sortBy(
      manifests.filter((item) => item.metadata.kind === "module").map((item) => item.body),
      ["index", "name"]
    );

    const header = this._render_header();
    const body = this.render_file(welcome_view_path, {
      app,
      modules,
      entries: [],
    });
    const footer = this._render_footer();
    const html = header + body + footer;
    return html;
  }

  async renderReact(data?: object) {
    const header = this._render_header();

    const file_path = "/home/krux/repos/krux.lan/home/k-app-engine/sample/welcome/jsx/sub/App.jsx";
    const output_file = "/home/krux/repos/krux.lan/home/k-app-engine/sample/welcome/jsx/sub/App.build";
    const flde_directory = path.dirname(file_path);
    let externalDependencies = ["react", "react-dom", "react-dom/client"];

    const rolllup_build = await rollup.rollup({
      input: file_path,
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
          compilerOptions: {
            module: "esnext",
            target: "es5",
            lib: ["es6", "dom"],
            sourceMap: true,
            jsx: "react",
            moduleResolution: "node",
            rootDir: flde_directory,
            noImplicitReturns: true,
            noImplicitThis: true,
            noImplicitAny: true,
            strictNullChecks: true,
            esModuleInterop: true,
            forceConsistentCasingInFileNames: true,
          },
        }),

        rollupTerser.terser(),
      ],
    });

    const output = await rolllup_build.write({
      file: output_file,
      format: "iife",
    });

    fs.unlinkSync(output_file);

    const body = `<div id="root"></div>
<script crossorigin src="https://unpkg.com/react@17/umd/react.development.js">
</script><script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
<script>${output.output[0].code}</script>`;

    const footer = this._render_footer();
    const html = header + body + footer;
    return html;
  }

  private _render_header() {
    const manifests = this.request.router.manifests;
    const app = manifests.find((item) => item.metadata.kind === "app")?.body;
    const modules = manifests.filter((item) => item.metadata.kind === "module").map((item) => item.body);

    const current_module = modules.find((item) => this.request.path.startsWith(item.prefix));
    let current_action = path.basename(this.request.route.path);
    const manifest_action = manifests.find((item) => item.folder === this.request.route.folder);
    if (manifest_action) {
      current_action = manifest_action.body.name;
    }

    const header_view_path = path.join(this.layout_dir, "header.ejs");
    return this.render_file(header_view_path, { app, modules, module: current_module, action: current_action });
  }

  private _render_body(view_name: string, data?: object) {
    const view_full_path = path.join(this.module_dir, view_name + this.template_extension);

    return this.render_file(view_full_path, data);
  }

  private _render_footer() {
    const footer_view_path = path.join(this.layout_dir, "footer.ejs");
    return this.render_file(footer_view_path, {});
  }

  private render_file(view_file_path: string, data?: object) {
    if (!fs.existsSync(view_file_path)) throw new Error("view file not exists at" + view_file_path);
    moment.locale("fr");
    const template = fs.readFileSync(view_file_path, { encoding: "utf-8" });

    const data_obj = {
      ...data,
      root_path: this.root_dir,
      moment,
    };

    const value = ejs.render(template, data_obj, {
      filename: view_file_path,
    });

    return value;
  }
}
