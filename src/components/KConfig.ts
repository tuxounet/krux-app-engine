export class KConfig {
  constructor() {
    this.context_folder = process.cwd();
    this.production = process.env.NODE_ENV === "production";
    this.port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  }

  context_folder: string;
  production: boolean;
  port: number;
  load() {
    console.info("CONTEXT FOLDER", this.context_folder);
    console.info("MODE PRODUCTION", this.production);
  }
}
