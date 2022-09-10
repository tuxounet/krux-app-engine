import { KDispatcher, KHookHandler } from "@krux/app-engine";

const handler: KHookHandler = async (dispatcher: KDispatcher) => {
  console.info("boot hook");
  return true;
};

export default handler;
