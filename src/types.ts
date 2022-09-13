import { KDispatcher } from "./components/KDispatcher";
import { KRequest } from "./components/KRequest";
import { KResponse } from "./components/structures/KResponse";
import { KSocketRequest } from "./components/KSocketRequest";
import { KSocketResponse } from "./components/structures/KSocketResponse";

export interface KRoute {
  verb: string;
  path: string;
  folder: string;
  handler?: KRouteHandler;
  file: string;
}

export type KRouteHandler = (req: KRequest, res: KResponse) => Promise<KResponse>;

export interface KSocketCommand {
  command: string;
  args?: Record<string, unknown>;
}
export interface KSocketRoute {
  command: string;
  handler?: KSocketHandler;
  folder: string;
  file: string;
}

export type KSocketHandler = (req: KSocketRequest, res: KSocketResponse) => Promise<KSocketResponse>;

export type KHookHandler = (dispatcher: KDispatcher) => Promise<boolean>;
export interface KHook {
  trigger: string;
  handler?: KHookHandler;
}

export interface KManifest<TBody = Record<string, string>> {
  folder: string;
  file: string;
  metadata: {
    id: string;
    kind: string;
  };
  body: TBody;
}
export { KDispatcher } from "./components/KDispatcher";

export * as constants from "./constants";
