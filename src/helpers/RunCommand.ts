import childProc from "child_process";
export async function RunCommand(cmd: string, cwd?: string) {
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
  });
}
