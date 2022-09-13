import { KSocketCommandResult } from "../../types";
import { KSocketRequest } from "./KSocketRequest";

export class KSocketResponse {
  constructor(readonly request: KSocketRequest) {}
  ok(body?: unknown) {
    const result: KSocketCommandResult = {
      kind: "command",
      command: this.request.command ? this.request.command : { command: "unknow" },
      is_error: false,
      result: body,
    };
    this.request.socket.send(JSON.stringify(result));
    return this;
  }
  fail(code: number, description: string) {
    const result: KSocketCommandResult = {
      kind: "command",
      command: this.request.command ? this.request.command : { command: "unknow" },
      is_error: true,
      error_code: code,
      error_description: description,
      result: undefined,
    };
    this.request.socket.send(JSON.stringify(result));
    return this;
  }
}
