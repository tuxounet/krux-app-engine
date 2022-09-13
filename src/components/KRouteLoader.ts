import path from "path";
import fs from "fs";
import fg from "fast-glob";
import { KHook, KHookHandler, KManifest, KRoute, KRouteHandler, KSocketHandler, KSocketRoute } from "../types";
import { KRouter } from "./KRouter";
import jsYaml from "js-yaml";
import { global_ignone_glob } from "../constants";

export class KRouterLoader {
  constructor(private readonly router: KRouter, public readonly routes_directory: string) {
    if (!fs.existsSync(this.routes_directory)) throw new Error("routes directory not exists");
    this.static_directory = path.join(routes_directory, "_static");
    
  }

  static_directory: string;

  async walkRestHandlers(allowed_verbs: string[]) {
    const entries = await fg(["**/*.ts"], {
      dot: false,
      onlyFiles: true,
      cwd: this.routes_directory,
      followSymbolicLinks: false,
      ignore: global_ignone_glob,
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
      .filter((item) => !["_layout", "_static"].includes(path.basename(item.folder)))

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



  async walSocketHandlers(allowed_verbs: string[]) {
    const entries = await fg(["**/socket.ts"], {
      dot: false,
      onlyFiles: true,
      cwd: this.routes_directory,
      followSymbolicLinks: false,
      ignore: global_ignone_glob,
    });

    const routes: KSocketRoute[] = entries
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
      .filter((item) => !["_layout", "_static"].includes(path.basename(item.folder)))
      .filter((item) => allowed_verbs.includes(item.verb))
      .map((item) => {
        
        const result: KSocketRoute = {       
          command : item.segments.length === 0 ? "/" : "/" + item.segments.join("/"),
          folder: item.folder,
          file: item.path,
        };

        return result;
      })
      .map((item) => {
        const result: KSocketRoute = {
          ...item,
        };
        try {
          const handler = require(item.file);
          result.handler = handler.default as KSocketHandler;
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
      followSymbolicLinks: false,
      ignore: global_ignone_glob,
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

  async walkHooks(allowed_hooks: string[]) {
    const entries = await fg(["**/*.hook.ts"], {
      dot: false,
      onlyFiles: true,
      cwd: this.routes_directory,
      followSymbolicLinks: false,
      ignore: global_ignone_glob,
    });

    const hooks: KHook[] = entries
      .map((item) => {
        const file_path = path.join(this.routes_directory, item);
        const file_name = path.basename(file_path);
        const trigger = file_name.replace(".hook.ts", "").trim();

        return {
          path: file_path,
          folder: path.dirname(path.join(this.routes_directory, item)),
          name: file_name,
          trigger: trigger,
        };
      })
      .filter((item) => allowed_hooks.includes(item.trigger))
      .map((item) => {
        let result: KHook = { trigger: item.trigger };
        try {
          const handler = require(item.path);
          const handler_method = handler.default as KHookHandler;
          result.handler = handler_method;
        } catch (e: any) {
          console.error("REQUIRE FAILURE", e.code, e);
        }
        return result;
      })
      .filter((item) => item.handler !== undefined);

    return hooks;
  }

}
