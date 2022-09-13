import { IncomingMessage } from "http";
import { KRouter } from "../KRouter";
import * as WebSocket from "ws";
import { KSocketCommand } from "../../types";

export class KSocketRequest {
  constructor(
    readonly router: KRouter,
    readonly upgrade_request: IncomingMessage,
    readonly socket: WebSocket.WebSocket,
    readonly message: WebSocket.RawData,
    readonly isBinary: boolean
  ) {
    if (!isBinary) {
      this.command = JSON.parse(message.toString("utf-8")) as KSocketCommand;
    }

    this.user = this.upgrade_request.headers["x-user"]
      ? String(this.upgrade_request.headers["x-user"])
      : this.router.config.production
      ? undefined
      : "anonymous";
    this.email = this.upgrade_request.headers["x-email"]
      ? String(this.upgrade_request.headers["x-email"])
      : this.router.config.production
      ? undefined
      : "anonymous@nowhere.nowhere";
  }
  user?: string;
  email?: string;
  command?: KSocketCommand;
}
