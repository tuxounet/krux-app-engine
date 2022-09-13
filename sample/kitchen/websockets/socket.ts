import { KSocketHandler } from "@krux/app-engine";

const handler: KSocketHandler = async (req, res) => {
  return res.ok({
    date: new Date().toISOString(),
  });
};

export default handler;
