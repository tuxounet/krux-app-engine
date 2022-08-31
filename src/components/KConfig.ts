export class KConfig {
  constructor() {
    this.context_folder = process.cwd();
    this.production = process.env.NODE_ENV === "production";
  }

  context_folder: string;
  production: boolean;
  load() {
    console.info("CONTEXT FOLDER", this.context_folder);
    console.info("MODE PRODUCTION", this.production);
  }
}
