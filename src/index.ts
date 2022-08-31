import { KRouter } from "./components/KRouter";

const run = () => {
  const router = new KRouter("sample");

  return router.setup();
};

run().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
