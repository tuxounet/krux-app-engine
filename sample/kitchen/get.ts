import { KRouteHandler } from "@krux/app-engine";

const handler: KRouteHandler = async (req, res) => {
  req.router.dispatcher.emit("test", "ici");
  return res.render({
    date: new Date().toISOString(),
  });
};

export default handler;
