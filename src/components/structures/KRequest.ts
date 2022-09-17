import type { Request } from "express";
import type { FileArray } from "express-fileupload";
import { KRoute } from "../../types";
import { KRouter } from "../KRouter";
import querystring from "querystring";
export class KRequest {
  constructor(public readonly router: KRouter, private readonly req: Request, public readonly route: KRoute) {
    this.method = this.req.method;
    this.path = this.req.path;
    this.body = this.req.body;

    this.headers = {};
    Object.keys(req.headers).forEach((item) => (this.headers[item] = req.headers[item]));

    this.query = this.req.query as querystring.ParsedUrlQuery;
    this.user = this.headers["x-user"]
      ? String(this.headers["x-user"])
      : this.router.config.production
      ? undefined
      : "anonymous";
    this.email = this.headers["x-email"]
      ? String(this.headers["x-email"])
      : this.router.config.production
      ? undefined
      : "anonymous@nowhere.nowhere";
    if (req.files) this.files = req.files;
  }
  headers: Record<string, string | string[] | undefined> = {};
  body?: Record<string, string>;
  query: querystring.ParsedUrlQuery;
  method: string;
  path: string;
  user?: string;
  email?: string;
  files?: FileArray;

  getQueryParamOrDefault(name: string, default_value: string) {
    if (this.req && this.req.query && this.req.query[name]) return String(this.req.query[name]);
    return default_value;
  }

  isAuthenticated(): boolean {
    if (!this.user) return false;
    if (typeof this.user !== "string") return false;
    if (this.user.trim() === "") return false;
    return true;
  }

  extractQuery(fields: string[]): Record<string, string> | undefined {
    if (!this.body) return undefined;
    if (!fields) return undefined;
    let result: Record<string, string> = {};
    for (const field of fields) {
      const value = this.query[field];
      if (!value) return undefined;
      result[field] = String(value);
    }
    return result;
  }

  extractBody(fields: string[]): Record<string, any> | undefined {
    if (!this.body) return undefined;
    if (!fields) return undefined;
    let result: Record<string, string> = {};
    for (const field of fields) {
      const value = this.body[field];
      if (!value) return undefined;
      result[field] = value;
    }
    return result;
  }
}
