import { KRouteHandler } from "../../../src/types";
import moment from "moment";

const handler: KRouteHandler = async (req, res) => {
  return res.render({
    date: moment().format(),
  });
};

export default handler;
