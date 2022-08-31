import path from "path";
import fs from "fs";
import fg from "fast-glob";
import { KManifest, KRoute, KRouteHandler } from "../types";
import chokidar from "chokidar";
import { KRouter } from "./KRouter";
import jsYaml from "js-yaml";
export class KRouterLoader {
  constructor(
    private readonly router: KRouter,
    public readonly routes_directory: string,
    private readonly onRoutesChanged: () => void
  ) {
    if (!fs.existsSync(this.routes_directory)) throw new Error("routes directory not exists");
    if (!router.config.production) {
      this.listen();
    }
  }

  async walkHandlers(allowed_verbs: string[]) {
    const entries = await fg(["**/*.ts"], {
      dot: false,
      onlyFiles: true,
      cwd: this.routes_directory,
    });

    const routes: KRoute[] = entries
      .map((item) => {
        const name = item.replace(/_root\//gi, "/");

        return {
          path: path.join(this.routes_directory, item),
          folder: path.dirname(path.join(this.routes_directory, item)),
          extension: path.extname(item),
          name,
          segments: path
            .dirname(name)
            .split(path.sep)
            .filter((item) => item !== ""),
          verb: path.basename(item).replace(path.extname(item), "").toLowerCase(),
        };
      })
      .filter((item) => !["_layout"].includes(path.basename(item.folder)))

      .map((item) => {
        const result: KRoute = {
          verb: item.verb,
          path: item.segments.length === 0 ? "/" : "/" + item.segments.join("/"),
          folder: item.folder,
          file: item.path,
        };

        return result;
      })
      .filter((item) => allowed_verbs.includes(item.verb))

      .map((item) => {
        const result: KRoute = {
          ...item,
        };
        try {
          const handler = require(item.file);
          result.handler = handler.default as KRouteHandler;
        } catch (e: any) {
          console.error("REQUIRE FAILURE", e.code, e);
        }

        return result;
      })
      .filter((item) => item.handler !== undefined);

    return routes;
  }

  async walkManifests() {
    const entries = await fg(["**/manifest.yaml"], {
      dot: false,
      onlyFiles: true,
      cwd: this.routes_directory,
    });

    const manifests = entries
      .map((item) => {
        return {
          path: path.join(this.routes_directory, item),
          folder: path.dirname(path.join(this.routes_directory, item)),
          extension: path.extname(item),
        };
      })
      .map((item) => {
        return {
          ...item,
          content: fs.readFileSync(item.path, { encoding: "utf-8" }),
        };
      })
      .map((item) => {
        return {
          ...item,
          body: jsYaml.load(item.content) as KManifest,
        };
      })
      .map((item) => {
        return {
          ...item.body,
          file: item.path,
          folder: item.folder,
        } as KManifest;
      });

    return manifests;
  }

  listen() {
    this.routes_directory;
    // One-liner for current directory
    chokidar.watch("**/*", { cwd: this.routes_directory }).on("all", (event, path) => {
      if (this.router.configuring) return;
      console.log(event, path);
      switch (event) {
        case "add":
        case "change":
        case "unlink":
          if (this.onRoutesChanged) this.onRoutesChanged();
          break;
      }
    });
  }
}
