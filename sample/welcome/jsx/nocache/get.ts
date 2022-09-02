import { KRouteHandler } from "@krux/app-engine";

const handler: KRouteHandler = async (req, res) => {
  return await res.renderReact({  
    date: new Date().toISOString(),
  });
};

export default handler;
 