import { describe, expect, it } from "vitest";
import { is_dangerous, is_modify, is_readonly } from "./sql";

describe("SQL statement type checks", () => {
	// Safe read-only statements
	it("SELECT is neither dangerous nor modify", () => {
		expect(is_dangerous("SELECT * FROM users")).toBe(false);
		expect(is_modify("SELECT * FROM users")).toBe(false);
		expect(is_readonly("SELECT * FROM users")).toBe(true);
	});

	// Insert statements
	it("INSERT is modify but not dangerous", () => {
		expect(is_dangerous("INSERT INTO users (id) VALUES (1)")).toBe(false);
		expect(is_modify("INSERT INTO users (id) VALUES (1)")).toBe(true);
		expect(is_readonly("INSERT INTO users (id) VALUES (1)")).toBe(false);
	});

	// Update statements
	it("UPDATE is both dangerous and modify", () => {
		expect(is_dangerous("UPDATE users SET name = 'a' WHERE id = 1")).toBe(true);
		expect(is_modify("UPDATE users SET name = 'a' WHERE id = 1")).toBe(true);
		expect(is_readonly("UPDATE users SET name = 'a' WHERE id = 1")).toBe(false);
	});

	// Delete statements
	it("DELETE is dangerous and modify", () => {
		expect(is_dangerous("DELETE FROM users WHERE id = 2")).toBe(true);
		expect(is_modify("DELETE FROM users WHERE id = 2")).toBe(true);
		expect(is_readonly("DELETE FROM users WHERE id = 2")).toBe(false);
	});

	// Drop table
	it("DROP TABLE is dangerous and modify", () => {
		expect(is_dangerous("DROP TABLE users")).toBe(true);
		expect(is_modify("DROP TABLE users")).toBe(true);
	});

	// Truncate and alter
	it("TRUNCATE and ALTER are dangerous and modify", () => {
		expect(is_dangerous("TRUNCATE TABLE users")).toBe(true);
		expect(is_modify("TRUNCATE TABLE users")).toBe(true);
		expect(is_dangerous("ALTER TABLE users ADD COLUMN age INT")).toBe(true);
		expect(is_modify("ALTER TABLE users ADD COLUMN age INT")).toBe(true);
	});

	// Grant and Revoke
	it("GRANT and REVOKE are dangerous operations", () => {
		expect(is_dangerous("GRANT SELECT ON users TO role_user")).toBe(true);
		expect(is_dangerous("REVOKE UPDATE ON users FROM role_user")).toBe(true);
	});

	// Create table
	it("CREATE TABLE is neither dangerous nor modify", () => {
		expect(is_dangerous("CREATE TABLE users (id INT)")).toBe(false);
		expect(is_modify("CREATE TABLE users (id INT)")).toBe(true);
	});

	// Multiple statements
	it("Mixed statements detect highest risk", () => {
		const sql = `SELECT * FROM users; DELETE FROM users WHERE id=3;`;
		expect(is_dangerous(sql)).toBe(true);
		expect(is_modify(sql)).toBe(true);
	});

	// Case insensitivity
	it("Lowercase statements are handled correctly", () => {
		expect(is_dangerous("delete from users")).toBe(true);
		expect(is_modify("insert into users values(1)")).toBe(true);
	});

	// Malformed SQL
	it("Malformed SQL does not throw and returns false", () => {
		expect(is_dangerous("FOOBAR")).toBe(true);
		expect(is_readonly("FOOBAR")).toBe(false);
	});

	// CTE with read-only inner SELECT
	it("WITH CTE SELECT is read-only", () => {
		const sql = "WITH cte AS (SELECT * FROM users) SELECT id FROM cte";
		expect(is_dangerous(sql)).toBe(false);
		expect(is_modify(sql)).toBe(false);
	});

	// CTE with UPDATE outer statement
	it("WITH CTE and UPDATE is dangerous and modify", () => {
		const sql =
			"WITH cte AS (SELECT * FROM users) UPDATE users SET name='a' WHERE id IN (SELECT id FROM cte)";
		expect(is_dangerous(sql)).toBe(true);
		expect(is_modify(sql)).toBe(true);
	});

	// Mixed CTE and DELETE statements
	it("mixed CTE and DELETE detect highest risk", () => {
		const sql =
			"WITH cte AS (SELECT * FROM users) SELECT * FROM cte; DELETE FROM users WHERE id=1;";
		expect(is_dangerous(sql)).toBe(true);
		expect(is_modify(sql)).toBe(true);
	});

	it("WITH delete_cte AS (DELETE FROM users WHERE id=1) DELETE FROM users WHERE id=2", () => {
		const sql =
			"WITH delete_cte AS (DELETE FROM users WHERE id=1) DELETE FROM users WHERE id=2";
		expect(is_dangerous(sql)).toBe(true);
		expect(is_modify(sql)).toBe(true);
	});
});
