import { KRouteHandler } from "@krux/app-engine";

const handler: KRouteHandler = async (req, res) => {
  console.dir(req.body);
  console.dir(req.files)
  return res.redirect("/welcome/hello");
};

export default handler;
