import { KRouteHandler } from "@krux/app-engine";

const handler: KRouteHandler = async (req, res) => {
  throw new Error("Expected error");
};

export default handler;
