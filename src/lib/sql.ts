import { Parser } from "node-sql-parser";

// Whitelist of clauses considered safe for read-only operations.
export const READONLY_CLAUSES = ["SELECT", "PRAGMA", "EXPLAIN"];

// Clauses that are safe to modify but not dangerous. (not destructive)
export const SAFE_MODIFY_CLAUSES = ["CREATE", "INSERT", "REPLACE", "UPSERT", "MERGE"];

export const SAFE_CLAUSES = [...READONLY_CLAUSES, ...SAFE_MODIFY_CLAUSES];

const parser = new Parser();

function get_statement_types(sql: string): string[] {
	try {
		const ast = parser.astify(sql);
		const stmts = Array.isArray(ast) ? ast : [ast];
		return stmts.map((stmt) => stmt.type.toUpperCase());
	} catch {
		const first = sql.trim().split(/\s+/)[0].toUpperCase();
		return [first];
	}
}

export function is_dangerous(sql: string): boolean {
	const types = get_statement_types(sql);
	return types.some((type) => !SAFE_CLAUSES.includes(type));
}

export function is_modify(sql: string): boolean {
	return !is_readonly(sql);
}

export function is_readonly(sql: string): boolean {
	const types = get_statement_types(sql);
	return types.every((type) => READONLY_CLAUSES.includes(type));
}
