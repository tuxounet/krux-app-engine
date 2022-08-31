 const run = async function cli() {
  console.info("creating a new app");



  




  console.info("create complete");
};

run().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
