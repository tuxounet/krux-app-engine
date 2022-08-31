import type { Request, Response } from "express";
import { KRoute } from "../types";
import { KRouter } from "./KRouter";

export class KRequest {
  constructor(public readonly router: KRouter, private readonly req: Request, public readonly route: KRoute) {
    this.method = this.req.method;
    this.path = this.req.path;
    this.body = this.req.body;
    this.query = this.req.query;
  }

  body?: Record<string, string>;
  query: Record<string, unknown>;
  method: string;
  path: string;

  getQueryParamOrDefault(name: string, default_value: string) {
    if (this.req && this.req.query && this.req.query[name]) return String(this.req.query);
    return default_value;
  }
}
