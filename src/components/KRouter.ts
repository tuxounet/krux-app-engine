import express from "express";
import type { Request, Response } from "express";
import bodyParser from "body-parser";
import { KRouterLoader } from "./KRouteLoader";
import morgan from "morgan";
import { KRequest } from "./structures/KRequest";
import { KResponse } from "./structures/KResponse";
import { createHttpTerminator, HttpTerminator } from "http-terminator";
import { KDispatcher } from "./KDispatcher";
import { KManifest, KRoute, KSocketPacket } from "../types";
import { KConfig } from "./KConfig";
import { KCodeBuilder } from "./KCodeBuilder";
import expressFileUpload from "express-fileupload";
import moment from "moment";
import * as WebSocket from "ws";
import { KSocketRequest } from "./structures/KSocketRequest";
import { KSocketResponse } from "./structures/KSocketResponse";

export class KRouter {
  base_path = "";
  cache_version = "v0";
  allowed_verbs = ["get", "post"];
  sockets_allowed_methods = ["socket"];
  listening: boolean;
  loader: KRouterLoader;

  terminator?: HttpTerminator;
  dispatcher: KDispatcher;
  manifests: KManifest[];
  codeBuilder: KCodeBuilder;
  connections: Record<string, WebSocket.WebSocket>;
  constructor(public readonly config: KConfig) {
    this.loader = new KRouterLoader(this, this.config.context_folder);
    this.dispatcher = new KDispatcher(this);
    this.manifests = [];
    this.listening = false;
    this.codeBuilder = new KCodeBuilder(this, this.dispatcher);
    this.connections = {};
  }

  async setup() {
    if (this.listening) {
      await this.close();
    }

    this.cache_version = String(moment().unix());
    const app = express();
    app.use(
      expressFileUpload({
        createParentPath: true,
        limits: {
          fileSize: 5 * 1024 * 1024 * 1024,
        },
      })
    );
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(morgan("tiny"));

    app.use("/_static", express.static(this.loader.static_directory));
    this.manifests = await this.loader.walkManifests();

    await this._bind_rest_routes(app);

    const ws_server = new WebSocket.Server({ noServer: true });
    this.connections = {};
    await this._bind_socket_routes(ws_server);

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
        server.on("upgrade", (request, socket, head) => {
          ws_server.handleUpgrade(request, socket, head, (socket) => {
            ws_server.emit("connection", socket, request);
          });
        });
      } catch (e) {
        reject(e);
        this.terminator = undefined;
      }
    });

    return result;
  }

  private async _bind_rest_routes(app: express.Application) {
    const rest_routes = await this.loader.walkRestHandlers(this.allowed_verbs);

    const menuRoute: KRoute = {
      verb: "get",
      path: "/",
      folder: "",
      file: "",
      handler: async (req, res) => {
        return res.renderMenu();
      },
    };

    const swRoute: KRoute = {
      verb: "get",
      path: "/sw.js",
      folder: "",
      file: "",
      handler: async (req, res) => {
        return res.renderServiceWorker();
      },
    };

    rest_routes.push(menuRoute);
    rest_routes.push(swRoute);
    for (const route of rest_routes) {
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
  }

  private async _bind_socket_routes(ws_server: WebSocket.Server) {
    const socket_handlers = await this.loader.walSocketHandlers(this.sockets_allowed_methods);
    let last_seq = 0;
    socket_handlers.forEach((item) => {
      console.info("register", "socket", item.command);
    });

    ws_server.on("connection", (socket, request) => {
      const connection_id = "socket_" + ++last_seq;
      this.connections[connection_id] = socket;
      console.info(connection_id, "ws open");

      const socket_error_close = (error_code: number, error_message: string, e?: any) => {
        console.error(connection_id, "ws query error", error_code, error_message, e);
        socket.close(1011, JSON.stringify({ type: "error", error_code, error_message }));
        return false;
      };
      socket.on("close", () => {
        delete this.connections[connection_id];
        console.info(connection_id, "ws closed");
      });

      socket.on("error", (err) => {
        console.error(connection_id, "ws error", err);
        socket.close();
      });

      socket.on("message", (message, isBinary) => {
        try {
          const socket_request = new KSocketRequest(this, request, socket, message, isBinary);
          const socket_response = new KSocketResponse(socket_request);
          if (!socket_request.email) return socket_error_close(401, "no authent, closing");
          if (!socket_request.command) return socket_error_close(400, "unparseable request");

          const cmd = socket_request.command;
          const handler = socket_handlers.find((item) => item.command === cmd.command);
          if (!handler || !handler.handler) return socket_error_close(404, "unhandled command");
          console.info("ws command", socket_request.email, cmd);

          handler
            .handler(socket_request, socket_response)
            .then(() => {
              console.info(connection_id, "ws command", socket_request.email, cmd, "completed");
            })
            .catch((e) => {
              return socket_error_close(500, "unexpected error", e);
            });
        } catch (e) {
          return socket_error_close(500, "unexpected error", e);
        }
      });

      const announce: KSocketPacket = {
        kind: "command",
        body: {
          command: "/_system/announce",
        },
      };
      socket.send(JSON.stringify(announce));
    });
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
    Object.keys(this.connections)
      .filter((item) => this.connections[item] !== undefined)
      .forEach((item) => {
        const socket = this.connections[item];
        socket.close(1011, JSON.stringify({ type: "error", error_code: 0, error_message: "server closing" }));
      });

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
    this.cache_version = "v0";
    this.listening = false;
  }
}
