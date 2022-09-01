import { KRouteHandler } from "@krux/app-engine";

const handler: KRouteHandler = async (req, res) => {
  return res.json({
    date: new Date().toISOString(),
  });
};

export default handler;
