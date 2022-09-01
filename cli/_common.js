const path = require("path");
const fs = require("fs");
const childProc = require("child_process");
module.exports.runOperation = function (look_dir, operation_name, env, withWatch) {
  const operations_directory = path.join(look_dir, "..", "src", "operations");
  const operation_file = path.join(operations_directory, operation_name) + ".ts";

  if (!fs.existsSync(operation_file)) {
    console.error("FATAL", "unknow opereation", operation_name);
    process.exit(1);
  }
  const run_directory = process.cwd();

  const ts_node_folder = path.join(run_directory, "node_modules", ".bin", "ts-node");
  if (!fs.existsSync(ts_node_folder)) {
    console.error("FATAL", "ts-node not found");
    process.exit(1);
  }
  let launch_command = ts_node_folder + " " + operation_file;
  if (withWatch) {
    const nodemon_node_folder = path.join(run_directory, "node_modules", ".bin", "nodemon");

    launch_command =
      nodemon_node_folder + " -e js,jsx,yaml,ts,tsx" + " --ignore 'node_modules/**'" + " --ignore '.git/**'" + ' --exec "' + ts_node_folder + '" ' + operation_file;
  }

  runCommand(launch_command, run_directory, env)
    .then(() => {
      console.info("DONE");
    })
    .catch((e) => {
      console.error("ERROR", e);
      process.exit(1);
    });
};

async function runCommand(cmd, cwd, env) {
  if (!env) env = {};

  const run_env = {
    ...process.env,
    ...env,
  };

  console.info(">", "execute", cmd, "inside", cwd);
  return new Promise((resolve, reject) => {
    const proc = childProc.exec(cmd, { env: run_env, cwd, shell: true }, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        code: proc.exitCode,
      });
    });
    proc.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
    });
    proc.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
    });
  });
}
