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

export type KRouterHandler = (router: KRouter) => void;

export class KRouter {
  port = 3000;
  base_path = "";

  allowed_verbs = ["get", "post"];
  configuring: boolean;
  loader: KRouterLoader;
  terminator?: HttpTerminator;
  dispatcher: KDispatcher;
  manifests: KManifest[];
  constructor(public readonly config: KConfig) {
    this.loader = new KRouterLoader(this, this.config.context_folder, this.routeUpdated.bind(this));
    this.dispatcher = new KDispatcher();
    this.manifests = [];
    this.configuring = true;
  }

  private routeUpdated() {
    this.close()
      .then(() => {
        return this.setup();
      })
      .catch((e) => {
        console.error("FATAL", e);
        process.exit(1);
      });
  }
  async boot() {
    return true;
  }

  async setup() {
    this.configuring = true;
    const app = express();
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
        const server = app.listen(this.port, () => {
          console.info("listening on port", this.port);

          resolve(true);
        });
        this.terminator = createHttpTerminator({
          server,
        });
      } catch (e) {
        reject(e);
        this.terminator = undefined;
      }
    });

    this.configuring = false;
    return result;
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
  }
}
