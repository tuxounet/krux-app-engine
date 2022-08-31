import { KConfig } from "../components/KConfig";
import { KRouter } from "../components/KRouter";

const run = async function cli() {
  console.info("start");
  const config = new KConfig();
  config.load();
  const router = new KRouter(config);

  await router.setup();
  
  console.info("set up ok ");
};

run().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
