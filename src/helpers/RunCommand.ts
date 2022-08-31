import childProc from "child_process";
export async function runCommand(cmd: string, cwd?: string) {
  return new Promise((resolve, reject) => {
    const proc = childProc.exec(
      cmd,
      {
        cwd,
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          stdout,
          stderr,
          code: proc.exitCode,
        });
      }
    );
    if (proc.stdout)
      proc.stdout.on("data", (chunk) => {
        process.stdout.write(chunk);
      });
    if (proc.stderr)
      proc.stderr.on("data", (chunk) => {
        process.stderr.write(chunk);
      });
  });
}
