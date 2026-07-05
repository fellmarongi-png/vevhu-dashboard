import { format } from "date-fns";
import { ClipboardList, Clock, FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

async function getDashboardData() {
	try {
		const supabase = await createClient();

		const today = new Date();
		const startOfDay = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
		).toISOString();

		const [
			totalSubmissionsResult,
			activeWorkersResult,
			todaySubmissionsResult,
			pendingSubmissionsResult,
			recentSubmissionsResult,
		] = await Promise.all([
			supabase.from("submissions").select("*", { count: "exact", head: true }),
			supabase
				.from("users")
				.select("*", { count: "exact", head: true })
				.eq("role", "worker"),
			supabase
				.from("submissions")
				.select("*", { count: "exact", head: true })
				.gte("created_at", startOfDay),
			supabase
				.from("submissions")
				.select("*", { count: "exact", head: true })
				.eq("status", "pending"),
			supabase
				.from("submissions")
				.select(
					"id, created_at, status, stand_number_official, users!worker_id(full_name)",
				)
				.order("created_at", { ascending: false })
				.limit(5),
		]);

		return {
			totalSubmissions: totalSubmissionsResult.count ?? 0,
			activeWorkers: activeWorkersResult.count ?? 0,
			todaySubmissions: todaySubmissionsResult.count ?? 0,
			pendingSubmissions: pendingSubmissionsResult.count ?? 0,
			recentSubmissions: recentSubmissionsResult.data ?? [],
		};
	} catch {
		return {
			totalSubmissions: 0,
			activeWorkers: 0,
			todaySubmissions: 0,
			pendingSubmissions: 0,
			recentSubmissions: [],
		};
	}
}

function getStatusVariant(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "approved":
		case "complete":
			return "default";
		case "pending":
			return "secondary";
		case "rejected":
		case "flagged":
			return "destructive";
		default:
			return "outline";
	}
}

export default async function DashboardPage() {
	const data = await getDashboardData();

	return (
		<div className="space-y-4 sm:space-y-8">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold tracking-tight">
						Overview
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground">
						Real-time field data collection metrics
					</p>
				</div>
			</header>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
				<Card className="relative overflow-hidden transition-shadow hover:shadow-md">
					<CardContent className="flex flex-col items-center p-3 text-center sm:p-5">
						<span className="mb-2 flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:mb-3 sm:size-10 sm:rounded-xl">
							<FileText className="size-4 sm:size-5" />
						</span>
						<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
							Total Submissions
						</p>
						<p className="mt-1 text-2xl font-bold tabular-nums sm:mt-2 sm:text-3xl">
							{data.totalSubmissions.toLocaleString()}
						</p>
						<p className="mt-1 text-[10px] text-muted-foreground sm:mt-1.5 sm:text-xs">
							All-time entries
						</p>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden transition-shadow hover:shadow-md">
					<CardContent className="flex flex-col items-center p-3 text-center sm:p-5">
						<span className="mb-2 flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 sm:mb-3 sm:size-10 sm:rounded-xl">
							<Users className="size-4 sm:size-5" />
						</span>
						<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
							Active Workers
						</p>
						<p className="mt-1 text-2xl font-bold tabular-nums sm:mt-2 sm:text-3xl">
							{data.activeWorkers.toLocaleString()}
						</p>
						<p className="mt-1 text-[10px] text-muted-foreground sm:mt-1.5 sm:text-xs">
							Registered field agents
						</p>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden transition-shadow hover:shadow-md">
					<CardContent className="flex flex-col items-center p-3 text-center sm:p-5">
						<span className="mb-2 flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 sm:mb-3 sm:size-10 sm:rounded-xl">
							<ClipboardList className="size-4 sm:size-5" />
						</span>
						<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
							Today
						</p>
						<p className="mt-1 text-2xl font-bold tabular-nums sm:mt-2 sm:text-3xl">
							{data.todaySubmissions.toLocaleString()}
						</p>
						<p className="mt-1 text-[10px] text-muted-foreground sm:mt-1.5 sm:text-xs">
							Collected today
						</p>
					</CardContent>
						</div>
						<p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
							Collected since 00:00
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 sm:p-6 sm:pb-2">
						<CardTitle className="text-xs sm:text-sm font-medium">
							Pending Sync
						</CardTitle>
						<ClockIcon className="size-3.5 sm:size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
						<div className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
							{data.pendingSubmissions.toLocaleString()}
						</div>
						<p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
							Awaiting verification
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-3 sm:gap-4 md:grid-cols-2">
				<Card>
					<CardHeader className="p-3 sm:p-6">
						<CardTitle className="text-sm sm:text-base">Recent Submissions</CardTitle>
						<CardDescription className="text-xs sm:text-sm">Latest field collections submitted by workers.</CardDescription>
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
						{data.recentSubmissions.length === 0 ? (
							<p className="text-sm text-muted-foreground py-8 text-center">
								No submissions yet. Data will appear once field workers submit
								forms.
							</p>
						) : (
							<div className="space-y-3">
								{data.recentSubmissions.map((submission) => (
									<div
										key={submission.id}
										className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
									>
										<div className="space-y-0.5">
											<p className="text-sm font-medium">
												{submission.worker_name}
											</p>
											<p className="text-xs text-muted-foreground">
												Stand {submission.stand_number_official ?? "—"} &middot;{" "}
												{format(
													new Date(submission.created_at),
													"dd MMM yyyy, HH:mm",
												)}
											</p>
										</div>
										<Badge variant={getStatusVariant(submission.status)}>
											{submission.status}
										</Badge>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Quick Actions</CardTitle>
						<CardDescription>Common management tasks</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-2">
						<a
							href="/dashboard/workers"
							className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
						>
							<span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
								<Users className="size-4" />
							</span>
							<div>
								<p className="text-sm font-medium">Manage Workers</p>
								<p className="text-xs text-muted-foreground">
									Add, edit or deactivate field agents
								</p>
							</div>
						</a>
						<a
							href="/dashboard/form-builder"
							className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
						>
							<span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
								<ClipboardList className="size-4" />
							</span>
							<div>
								<p className="text-sm font-medium">Form Builder</p>
								<p className="text-xs text-muted-foreground">
									Edit collection form schema
								</p>
							</div>
						</a>
						<a
							href="/dashboard/announcements"
							className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
						>
							<span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
								<FileText className="size-4" />
							</span>
							<div>
								<p className="text-sm font-medium">Send Announcement</p>
								<p className="text-xs text-muted-foreground">
									Broadcast messages to workers
								</p>
							</div>
						</a>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
