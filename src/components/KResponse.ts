import type { Request, Response } from "express";
import { KLayout } from "./KLayout";
import { KRequest } from "./KRequest";

export class KResponse {
  constructor(private readonly request: KRequest, private res: Response) {}

  ok(body?: string) {
    this.res.statusCode = 200;
    if (!body) this.res.send("ok");
    else this.res.send(body);
    return this;
  }

  render(data?: object) {
    const layout = new KLayout(this.request);

    const view_name = this.request.route.verb;

    let result = {
      navigation: {},
    };
    if (data) {
      result = {
        ...result,
        ...data,
      };
    }

    const body = layout.render(view_name, result);
    this.res.statusCode = 200;
    this.res.send(body);

    return this;
  }

  async renderReact(data?: object) {
    const layout = new KLayout(this.request);

    let result = {
      navigation: {},
    };
    if (data) {
      result = {
        ...result,
        ...data,
      };
    }

    const body = await layout.renderReact(result);
    this.res.statusCode = 200;
    this.res.send(body);

    return this;
  }

  renderWelcome() {
    const layout = new KLayout(this.request);

    const body = layout.renderWelcome();
    this.res.statusCode = 200;
    this.res.send(body);

    return this;
  }

  redirect(target: string) {
    this.res.redirect(target);
    return this;
  }

  fail(message: string) {
    this.res.statusCode = 500;
    this.res.redirect(message);
    return this;
  }

  badRequest(name: string) {
    this.res.statusCode = 400;
    this.res.send(name);
    return this;
  }
}
