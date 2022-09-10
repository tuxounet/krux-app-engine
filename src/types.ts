import { KDispatcher } from "./components/KDispatcher";
import { KRequest } from "./components/KRequest";
import { KResponse } from "./components/KResponse";

export type KRouteHandler = (req: KRequest, res: KResponse) => Promise<KResponse>;

export type KHookHandler = (dispatcher: KDispatcher) => Promise<boolean>;
export interface KHook {
  trigger: string;
  handler?: KHookHandler;
}

export interface KRoute {
  verb: string;
  path: string;
  folder: string;
  handler?: KRouteHandler;
  file: string;
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
