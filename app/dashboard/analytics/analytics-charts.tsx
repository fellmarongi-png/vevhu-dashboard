"use client";

import { AlertTriangle, FileText, RefreshCw, Users } from "lucide-react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface KPI {
	totalRecords: number;
	activeWorkersToday: number;
	pendingSyncs: number;
	flagged: number;
}

interface DailySubmission {
	date: string;
	count: number;
}

interface WorkerRecord {
	worker: string;
	count: number;
}

interface LeaderboardEntry {
	worker_id: string;
	worker_name: string;
	records: number;
}

interface AnalyticsChartsProps {
	kpi: KPI;
	dailyData: DailySubmission[];
	workerData: WorkerRecord[];
	leaderboard: LeaderboardEntry[];
}

export function AnalyticsCharts({
	kpi,
	dailyData,
	workerData,
	leaderboard,
}: AnalyticsChartsProps) {
	const kpiCards = [
		{
			title: "Total Records",
			value: kpi.totalRecords.toLocaleString(),
			description: "All submissions",
			icon: FileText,
			badge: "All time",
			badgeVariant: "secondary" as const,
		},
		{
			title: "Active Workers Today",
			value: kpi.activeWorkersToday.toString(),
			description: "Field agents with submissions today",
			icon: Users,
			badge: "Today",
			badgeVariant: "default" as const,
		},
		{
			title: "Pending Syncs",
			value: kpi.pendingSyncs.toLocaleString(),
			description: "Submissions awaiting sync",
			icon: RefreshCw,
			badge: "Live",
			badgeVariant: "secondary" as const,
		},
		{
			title: "Flagged",
			value: kpi.flagged.toLocaleString(),
			description: "Submissions flagged for review",
			icon: AlertTriangle,
			badge: "Review",
			badgeVariant: "destructive" as const,
		},
	];

	return (
		<div className="space-y-4 sm:space-y-6">
			<div>
				<h1 className="text-lg sm:text-2xl font-bold tracking-tight">
					Analytics
				</h1>
				<p className="text-xs sm:text-sm text-muted-foreground">
					Field data insights and worker performance overview.
				</p>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
				{kpiCards.map((card) => (
					<Card key={card.title} className="transition-shadow hover:shadow-md">
						<CardContent className="flex flex-col items-center p-3 text-center sm:p-5">
							<span className="mb-2 flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:mb-3 sm:size-10 sm:rounded-xl">
								<card.icon className="size-4 sm:size-5" />
							</span>
							<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
								{card.title}
							</p>
							<p className="mt-1 text-2xl font-bold tabular-nums sm:mt-2 sm:text-3xl">
								{card.value}
							</p>
							<p className="mt-1 text-[10px] text-muted-foreground sm:mt-1.5 sm:text-xs">
								{card.description}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Charts */}
			<div className="grid gap-3 sm:gap-4 md:grid-cols-2">
				<Card>
					<CardHeader className="p-3 sm:p-6">
						<CardTitle className="text-sm sm:text-base">
							Daily Submissions
						</CardTitle>
						<CardDescription className="text-xs">Last 30 days</CardDescription>
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
						<div className="h-[200px] sm:h-[300px]">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={dailyData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
									<YAxis allowDecimals={false} />
									<Tooltip />
									<Line
										type="monotone"
										dataKey="count"
										stroke="#6366f1"
										strokeWidth={2}
										dot={false}
										name="Submissions"
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="p-3 sm:p-6">
						<CardTitle className="text-sm sm:text-base">
							Records per Worker
						</CardTitle>
						<CardDescription className="text-xs">
							Top 15 workers (all time)
						</CardDescription>
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
						<div className="h-[200px] sm:h-[300px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={workerData}
									layout="vertical"
									margin={{ left: 0, right: 16 }}
								>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis type="number" allowDecimals={false} />
									<YAxis
										type="category"
										dataKey="worker"
										width={80}
										tick={{ fontSize: 10 }}
									/>
									<Tooltip />
									<Bar
										dataKey="count"
										fill="#6366f1"
										name="Records"
										radius={[0, 4, 4, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Worker Leaderboard */}
			<Card>
				<CardHeader className="p-3 sm:p-6">
					<CardTitle className="text-sm sm:text-base">
						Worker Leaderboard
					</CardTitle>
					<CardDescription className="text-xs">
						Top 10 workers by records this week
					</CardDescription>
				</CardHeader>
				<CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
					{leaderboard.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No submissions this week yet.
						</p>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left text-muted-foreground">
										<th className="pb-2 font-medium w-10">#</th>
										<th className="pb-2 font-medium">Worker</th>
										<th className="pb-2 font-medium text-right">Records</th>
									</tr>
								</thead>
								<tbody>
									{leaderboard.map((entry, i) => (
										<tr
											key={entry.worker_id}
											className="border-b last:border-0"
										>
											<td className="py-2 text-muted-foreground">{i + 1}</td>
											<td className="py-2 font-medium">{entry.worker_name}</td>
											<td className="py-2 text-right tabular-nums">
												{entry.records}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
