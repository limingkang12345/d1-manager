<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import { page } from "$app/stores";
	import { is_dangerous } from "$lib/sql";
	import { t } from "svelte-i18n";
	import type { PageData } from "./$types";

	export let data: PageData;

	let query = "";
	$: danger = is_dangerous(query);

	function handler(evt: KeyboardEvent) {
		if (evt.code === "Enter" && evt.shiftKey === true && query) {
			run();
		}
	}

	let running = false;
	let duration: number | undefined;
	let error = "";
	async function run() {
		if (running) {
			return;
		}
		running = true;

		try {
			const q = query
				.split(";")
				.filter((q) => q.trim())
				.map((q) => q.replace(/\n/g, "\\n"))
				.join("\n");
			const res = await fetch(`/api/db/${$page.params.database}/exec`, {
				method: "POST",
				body: JSON.stringify({ query: q }),
			});

			const json = await res.json<any>();
			if (json) {
				if (res.status == 500 && json.code == 400) {
					error = json?.message;
					duration = undefined;
				} else if (res.status == 500) {
					error = "An unknown error has occurred.  Check the browser devtools for more.";
					duration = undefined;
				} else {
					duration = json.duration;
					error = "";
					await invalidateAll();
				}
			} else {
				throw new Error("Unknown");
			}
		} catch (err) {
			error = err instanceof Error ? err.message : "Unknown";
			duration = undefined;
		} finally {
			running = false;
		}
	}
</script>

<svelte:head>
	<title>{$page.params.database} | {$t("d1-manager.name")}</title>
	<meta
		name="description"
		content={$t("d1-manager-manage-db", { values: { db: $page.params.database } })}
	/>
</svelte:head>

<div class="flex w-full flex-col items-center justify-start gap-4 p-4">
	<div class="card-border card w-full">
		<div class="card-body">
			<div class="join">
				<textarea
					class="textarea-border textarea focus:textarea-primary join-item h-10 w-full flex-1 resize-y !rounded-l-lg font-mono transition-colors"
					class:!outline-error={danger}
					placeholder={$t("execute-sql-query-in-database", {
						values: { db: $page.params.database },
					})}
					bind:value={query}
					on:keypress={handler}
					disabled={running}
				></textarea>
				{#if query}
					<button
						class="btn-primary btn join-item h-auto min-w-[6rem]"
						class:btn-error={danger}
						on:click={run}
						disabled={running}
					>
						Execute
					</button>
				{/if}
			</div>

			{#if error}
				<div class="text-error mt-2">{error}</div>
			{:else if duration}
				<div class="mt-2 text-sm">
					{$t("n-ms", { values: { n: duration.toFixed(2) } })}
				</div>
			{/if}
		</div>
	</div>

	{#each data.db as table}
		<a class="w-full" href="/db/{$page.params.database}/{table.name}">
			<div
				class="card-border card hover:border-primary w-full transition-all hover:shadow-md"
			>
				<div class="card-body">
					<h2 class="card-title">{table.name}</h2>

					<div class="stats">
						<div class="stat">
							<div class="stat-title">{$t("rows")}</div>
							<div class="stat-value">{table.count}</div>
						</div>
					</div>

					<div class="divider"></div>

					<div>
						<div class="overflow-x-auto">
							<table class="table-sm bg-base-200 table w-full">
								<thead>
									<tr>
										<th>{$t("col-name")}</th>
										<th>{$t("col-type")}</th>
										<th>{$t("col-default")}</th>
									</tr>
								</thead>
								<tbody>
									{#each table.columns as column}
										<tr class="hover" class:font-bold={column.pk}>
											<td>{column.name}</td>
											<td>{column.type}</td>
											<td>{column.dflt_value}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</a>
	{/each}
</div>
