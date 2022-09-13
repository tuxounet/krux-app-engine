import _ from "lodash";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import moment from "moment";
import { KRequest } from "./structures/KRequest";

export class KLayout {
  template_extension = ".ejs";
  private layout_dir: string;
  private readonly root_dir: string;
  private readonly module_dir: string;

  constructor(private readonly request: KRequest) {
    this.root_dir = this.request.router.loader.routes_directory;
    this.module_dir = this.request.route.folder;

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

  renderServiceWorker() {
    const service_worker_file = "sw.js";
    const service_worker_path = path.join(this.layout_dir, service_worker_file);
    if (!fs.existsSync(service_worker_path)) {
      return undefined;
    }

    const sw_body = fs.readFileSync(service_worker_path, { encoding: "utf-8" });
    const sw_result = `var cache_version="${this.request.router.cache_version}";\n` + sw_body;
    return sw_result;
  }

  renderError(message: string, error_data?: any) {
    const header = this._render_header();

    const body = `<div><h1>Une erreur est survenue</h1><h2>${message}</h2><pre>${error_data}</pre></div>`;

    const footer = this._render_footer();
    const html = header + body + footer;
    return html;
  }

  async renderReact(data?: object) {
    const header = this._render_header();
    const app_suffix = ".app";

    const app_folder = this.request.route.folder;
    const app_entry_point = this.request.route.verb + app_suffix + ".jsx";
    const entry_point_file = path.join(app_folder, app_entry_point);

    const body = await this.request.router.codeBuilder.buildReact(
      this.request.route.path,
      this.request.route.verb,
      entry_point_file,
      data
    );

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
    return this.render_file(header_view_path, {
      path: this.request.route.path,
      app,
      modules,
      module: current_module,
      action: current_action,
    });
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
