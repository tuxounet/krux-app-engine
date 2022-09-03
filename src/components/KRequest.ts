import type { Request, Response } from "express";
import { KRoute } from "../types";
import { KRouter } from "./KRouter";
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
  }
  headers: Record<string, string | string[] | undefined> = {};
  body?: Record<string, string>;
  query: querystring.ParsedUrlQuery;
  method: string;
  path: string;
  user?: string;
  email?: string;

  getQueryParamOrDefault(name: string, default_value: string) {
    if (this.req && this.req.query && this.req.query[name]) return String(this.req.query);
    return default_value;
  }

  isAuthenticated(): boolean {
    if (!this.user) return false;
    if (typeof this.user !== "string") return false;
    if (this.user.trim() === "") return false;
    return true;
  }
}
