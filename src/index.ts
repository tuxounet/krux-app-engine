import { KConfig } from "./components/KConfig";
import { KRouter } from "./components/KRouter";

const run = () => {
  const config = new KConfig();
  config.load()
  const router = new KRouter(config);

  return router.setup();
};

run().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
