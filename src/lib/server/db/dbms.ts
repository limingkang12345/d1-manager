import { extend } from "$lib/log";
import type { D1Database } from "@cloudflare/workers-types";

const log = extend("dbms");

export function DBMS(
	env: Record<string, Fetcher | D1Database | string>,
): Record<string, D1Database> {
	const keys = Object.keys(env).filter((k) => k.startsWith("DB"));
	log("Database Bindings:", keys.join(", "));

	const results: Record<string, D1Database> = {};
	for (const k of keys) {
		const e = env[k];
		if (typeof e === "string") {
			continue;
		}
		if (!("prepare" in e)) {
			continue;
		}
		results[k.replace(/^DB_?/, "") || "default"] = e;
	}
	return results;
}
