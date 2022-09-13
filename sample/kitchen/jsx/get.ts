import { KRouteHandler } from "@krux/app-engine";

const handler: KRouteHandler = async (req, res) => {
  return await res.renderReact({  
    msg: "welcome"
  });
};

export default handler;
 