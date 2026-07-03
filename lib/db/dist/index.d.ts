import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
declare const Pool: typeof import("pg").Pool;
export declare const pool: InstanceType<typeof Pool>;
export declare const db: ReturnType<typeof drizzle<typeof schema>>;
export * from "./schema";
//# sourceMappingURL=index.d.ts.map