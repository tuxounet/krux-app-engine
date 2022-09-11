import { KRouteHandler } from "@krux/app-engine";

const handler: KRouteHandler = async (req, res) => {
  return res.render({  
    date: new Date().toISOString(),
  });
};

export default handler;
 