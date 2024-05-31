export class Database {
  private static instance: Database;

  private constructor(private kv: Deno.Kv) {}

  public static async getInstance(): Promise<Database> {
    if (!Database.instance) {
      Database.instance = new Database(
        await Deno.openKv(Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined ? undefined : "kv.db"),
      );
    }

    return Database.instance;
  }

  async increment(resourse: string, key: string, value: string): Promise<number> {
    const current = await this.get(resourse, key, value);
    await this.kv.set(["statistics", resourse, key, value], current + 1);
    return current + 1;
  }

  async get(resourse: string, key: string, value: string): Promise<number> {
    return (await this.kv.get<number>(["statistics", resourse, key, value])).value ?? 0;
  }

  async getResourse(resourse?: string) {
    let prefix = ["statistics"];
    if (resourse) {
      prefix = ["statistics", ...resourse.split(",")];
    }

    console.log(prefix);
    const out: { key: readonly unknown[]; value: unknown }[] = [];

    for await (const item of this.kv.list({ prefix })) {
      out.push({ key: item.key, value: item.value ?? 0 });
    }

    return out;
  }
}
