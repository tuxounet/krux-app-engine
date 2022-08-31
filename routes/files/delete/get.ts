import path from "path";
import { KRouteHandler } from "../../../src/types";
import { FileSource } from "../store";
import { getFormatFromExtension } from "../_common/formats/all";

const handler: KRouteHandler = async (req, res) => {
  const files = new FileSource(req.router.dispatcher);
  if (!files.isInitialized()) {
    return res.redirect("/repos/list");
  }

  const prefix = req.query.prefix ? String(req.query.prefix) : "/";
  const name = String(req.query.name);
  const back_url = req.query.back_url;
  const item = !req.query.name ? files.getFolder(prefix) : files.getText(prefix, name);

  const format = getFormatFromExtension(item.extension);
  const result = {
    ...item,
    format,
    back_url: encodeURIComponent("/files/list?prefix=" + (!req.query.name ? prefix : prefix + name)),
  };
  return res.render(result);
};

export default handler;
