import express from "express";
import type { Request, Response } from "express";
import bodyParser from "body-parser";
import { KRouterLoader } from "./KRouteLoader";
import morgan from "morgan";
import { KRequest } from "./KRequest";
import { KResponse } from "./KResponse";
import { createHttpTerminator, HttpTerminator } from "http-terminator";
import { KDispatcher } from "./KDispatcher";
import { KManifest, KRoute } from "../types";
import { KConfig } from "./KConfig";
import { KCodeBuilder } from "./KCodeBuilder";
import expressFileUpload from "express-fileupload";

export type KRouterHandler = (router: KRouter) => void;

export class KRouter {
  base_path = "";

  allowed_verbs = ["get", "post"];
  listening: boolean;
  loader: KRouterLoader;
  terminator?: HttpTerminator;
  dispatcher: KDispatcher;
  manifests: KManifest[];
  codeBuilder: KCodeBuilder;

  constructor(public readonly config: KConfig) {
    this.loader = new KRouterLoader(this, this.config.context_folder);
    this.dispatcher = new KDispatcher();
    this.manifests = [];
    this.listening = false;
    this.codeBuilder = new KCodeBuilder(this, this.dispatcher);
  }

  async setup() {
    if (this.listening) {
      await this.close();
    }
    const app = express();
    app.use(
      expressFileUpload({
        createParentPath: true,
        limits: {
          fileSize: 5 * 1024 * 1024 * 1024, //2MB max file(s) size
        },
      })
    );
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(morgan("tiny"));

    const routes = await this.loader.walkHandlers(this.allowed_verbs);
    this.manifests = await this.loader.walkManifests();

    const welcomeRoute: KRoute = {
      verb: "get",
      path: "/",
      folder: "",
      file: "",
      handler: async (req, res) => {
        return res.renderWelcome();
      },
    };

    routes.push(welcomeRoute);
    for (const route of routes) {
      console.info("register", route.verb, route.path);
      switch (route.verb) {
        case "get":
          app.get(route.path, (req: Request, res: Response) => {
            if (!route.handler) {
              res.status(404).send("code not found");
              return;
            }
            const request = new KRequest(this, req, route);
            const response = new KResponse(request, res);
            route.handler(request, response).catch((e) => {
              console.error(e);
              response.fail("an error occured", e);
            });
          });
          break;
        case "post":
          app.post(route.path, (req: Request, res: Response) => {
            if (!route.handler) {
              res.status(404).send("code not found");
              return;
            }
            const request = new KRequest(this, req, route);
            const response = new KResponse(request, res);
            route.handler(request, response).catch((e) => {
              console.error(e);
              response.fail("an error occured", e);
            });
          });
          break;
      }
    }

    const result = await new Promise((resolve, reject) => {
      try {
        let address = "0.0.0.0";

        if (this.config.production) {
          address = "127.0.0.1";
        }
        const server = app.listen(this.config.port, address, () => {
          console.info("listening on port", this.config.port, "at", address);
          this.listening = true;

          this.boot_hook()
            .then(() => resolve(true))
            .catch((e) => {
              console.error(e), resolve(false);
            });
        });
        this.terminator = createHttpTerminator({
          server,
        });
      } catch (e) {
        reject(e);
        this.terminator = undefined;
      }
    });

    return result;
  }
  private async boot_hook() {
    const boot_hooks = await this.loader.walkHooks(["boot"]);

    if (boot_hooks) {
      console.info("running boot hooks", boot_hooks);
      await Promise.all(
        boot_hooks
          .map((item) => {
            if (item.handler) return item.handler(this.dispatcher);
            return undefined;
          })
          .filter((item) => item !== undefined)
      );
    }
    return true;
  }

  async close() {
    Object.keys(require.cache)
      .filter((item) => item.startsWith(this.config.context_folder))
      .forEach((item) => {
        delete require.cache[item];
      });

    this.manifests = [];
    if (this.terminator) {
      await this.terminator.terminate();
      this.terminator = undefined;
    }
    this.listening = false;
  }
}
