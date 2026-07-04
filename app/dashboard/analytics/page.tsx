import { endOfDay, format, startOfDay, startOfWeek, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsCharts } from "./analytics-charts";

export const dynamic = "force-dynamic";

interface WorkerRow {
	worker_id: string;
	users?: { full_name?: string } | null;
}

export default async function AnalyticsPage() {
	let kpi = {
		totalRecords: 0,
		activeWorkersToday: 0,
		pendingSyncs: 0,
		flagged: 0,
	};
	let dailyData: { date: string; count: number }[] = [];
	let workerData: { worker: string; count: number }[] = [];
	let leaderboard: {
		worker_id: string;
		worker_name: string;
		records: number;
	}[] = [];

	try {
		const supabase = await createClient();
		const now = new Date();
		const todayStart = startOfDay(now).toISOString();
		const todayEnd = endOfDay(now).toISOString();
		const weekStart = startOfWeek(now).toISOString();
		const thirtyDaysAgo = subDays(now, 30).toISOString();

		// --- KPI queries (parallel, using count-only where possible) ---
		const [
			{ count: totalRecords },
			{ data: todayWorkers },
			{ count: pendingSyncs },
			{ count: flagged },
		] = await Promise.all([
			supabase.from("submissions").select("*", { count: "exact", head: true }),
			supabase
				.from("submissions")
				.select("worker_id")
				.gte("created_at", todayStart)
				.lte("created_at", todayEnd)
				.limit(1000),
			supabase
				.from("submissions")
				.select("*", { count: "exact", head: true })
				.eq("status", "pending"),
			supabase
				.from("submissions")
				.select("*", { count: "exact", head: true })
				.eq("status", "flagged"),
		]);

		const uniqueWorkers = new Set(
			(todayWorkers ?? []).map((r: { worker_id: string }) => r.worker_id),
		);

		kpi = {
			totalRecords: totalRecords ?? 0,
			activeWorkersToday: uniqueWorkers.size,
			pendingSyncs: pendingSyncs ?? 0,
			flagged: flagged ?? 0,
		};

		// --- Daily submissions (last 30 days) ---
		// Fetch only created_at for the date range, limit to prevent unbounded fetch
		const { data: recentSubmissions } = await supabase
			.from("submissions")
			.select("created_at")
			.gte("created_at", thirtyDaysAgo)
			.order("created_at", { ascending: true })
			.limit(50000);

		// Build day counts map (pre-populate all 30 days for chart continuity)
		const dayCounts: Record<string, number> = {};
		for (let i = 29; i >= 0; i--) {
			const d = format(subDays(now, i), "MMM d");
			dayCounts[d] = 0;
		}
		(recentSubmissions ?? []).forEach((row: { created_at: string }) => {
			const d = format(new Date(row.created_at), "MMM d");
			if (d in dayCounts) dayCounts[d]++;
		});
		dailyData = Object.entries(dayCounts).map(([date, count]) => ({
			date,
			count,
		}));

		// --- Worker bar chart (top 15 all time) ---
		// Fetch worker_id with join to workers table, limited to prevent unbounded load
		const { data: workerRows } = await supabase
			.from("submissions")
			.select("worker_id, users!worker_id(full_name)")
			.limit(50000);

		const workerCounts: Record<string, { name: string; count: number }> = {};
		((workerRows as WorkerRow[] | null) ?? []).forEach((row) => {
			const id = row.worker_id;
			const name = row.users?.full_name ?? id;
			if (!workerCounts[id]) workerCounts[id] = { name, count: 0 };
			workerCounts[id].count++;
		});
		workerData = Object.values(workerCounts)
			.sort((a, b) => b.count - a.count)
			.slice(0, 15)
			.map((w) => ({ worker: w.name, count: w.count }));

		// --- Leaderboard: top 10 workers this week ---
		const { data: weekRows } = await supabase
			.from("submissions")
			.select("worker_id, users!worker_id(full_name)")
			.gte("created_at", weekStart)
			.limit(10000);

		const weekCounts: Record<string, { name: string; count: number }> = {};
		((weekRows as WorkerRow[] | null) ?? []).forEach((row) => {
			const id = row.worker_id;
			const name = row.users?.full_name ?? id;
			if (!weekCounts[id]) weekCounts[id] = { name, count: 0 };
			weekCounts[id].count++;
		});
		leaderboard = Object.entries(weekCounts)
			.sort((a, b) => b[1].count - a[1].count)
			.slice(0, 10)
			.map(([id, { name, count }]) => ({
				worker_id: id,
				worker_name: name,
				records: count,
			}));
	} catch (error) {
		console.error("Analytics data fetch failed:", error);
		// Fallback values already set above
	}

	return (
		<AnalyticsCharts
			kpi={kpi}
			dailyData={dailyData}
			workerData={workerData}
			leaderboard={leaderboard}
		/>
	);
}
