"use client";

import { AlertCircle, PencilIcon, PlusIcon, PowerIcon } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type WorkerDefaults,
	WorkerForm,
} from "@/components/workers/worker-form";
import { createClient } from "@/lib/supabase/client";

type Worker = {
	id: string;
	full_name: string;
	phone: string | null;
	zone_assigned: string | null;
	daily_target: number | null;
	pin: string | null;
	is_active: boolean | null;
	today_count?: number;
};

export default function WorkersPage() {
	const [workers, setWorkers] = React.useState<Worker[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const [addOpen, setAddOpen] = React.useState(false);
	const [editWorker, setEditWorker] = React.useState<Worker | null>(null);

	const fetchWorkers = React.useCallback(async () => {
		const supabase = createClient();
		const today = new Date().toISOString().slice(0, 10);

		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("role", "worker")
			.order("full_name");

		if (error || !data) {
			setError(error?.message ?? "Failed to load workers.");
			setLoading(false);
			return;
		}

		const { data: counts } = await supabase
			.from("submissions")
			.select("worker_id")
			.gte("collected_at", `${today}T00:00:00`)
			.lt("collected_at", `${today}T23:59:59`);

		const countMap: Record<string, number> = {};
		if (counts) {
			for (const row of counts) {
				countMap[row.worker_id] = (countMap[row.worker_id] ?? 0) + 1;
			}
		}

		setWorkers(data.map((w) => ({ ...w, today_count: countMap[w.id] ?? 0 })));
		setLoading(false);
	}, []);

	React.useEffect(() => {
		fetchWorkers();
	}, [fetchWorkers]);

	async function toggleActive(worker: Worker) {
		const supabase = createClient();
		await supabase
			.from("users")
			.update({ is_active: !worker.is_active })
			.eq("id", worker.id);
		setWorkers((prev) =>
			prev.map((w) =>
				w.id === worker.id ? { ...w, is_active: !w.is_active } : w,
			),
		);
	}

	function targetPercent(worker: Worker) {
		if (!worker.daily_target || worker.daily_target === 0) return null;
		return Math.round(((worker.today_count ?? 0) / worker.daily_target) * 100);
	}

	return (
		<div className="space-y-3 sm:space-y-4">
			{/* Header: stack on mobile, row on sm+ */}
			<div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-lg sm:text-2xl font-bold tracking-tight">
						Workers
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground">
						Manage field workers and their targets.
					</p>
				</div>

				<Dialog open={addOpen} onOpenChange={setAddOpen}>
					<DialogTrigger
						render={
							<Button className="w-full sm:w-auto">
								<PlusIcon />
								Add Worker
							</Button>
						}
					/>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add Worker</DialogTitle>
						</DialogHeader>
						<WorkerForm
							onSuccess={() => {
								setAddOpen(false);
								fetchWorkers();
							}}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error loading workers</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{loading ? (
				<p className="text-sm text-muted-foreground">Loading workers…</p>
			) : !error ? (
				/* Horizontal scroll wrapper for mobile */
				<div className="rounded-xl border ring-1 ring-foreground/10 overflow-hidden">
					<div className="overflow-x-auto">
						<Table className="text-xs sm:text-sm">
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									{/* Zone hidden on mobile */}
									<TableHead className="hidden sm:table-cell">Zone</TableHead>
									<TableHead>Today</TableHead>
									{/* Target % hidden on mobile */}
									<TableHead className="hidden sm:table-cell">
										Target %
									</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{workers.length ? (
									workers.map((worker) => {
										const pct = targetPercent(worker);
										return (
											<TableRow key={worker.id}>
												<TableCell className="font-medium">
													{worker.full_name}
												</TableCell>
												<TableCell className="hidden sm:table-cell">
													{worker.zone_assigned ?? "—"}
												</TableCell>
												<TableCell>
													{worker.today_count ?? 0} /{" "}
													{worker.daily_target ?? "—"}
												</TableCell>
												<TableCell className="hidden sm:table-cell">
													{pct !== null ? (
														<span
															className={
																pct >= 100
																	? "text-green-600 font-medium"
																	: pct >= 50
																		? "text-yellow-600 font-medium"
																		: "text-red-600 font-medium"
															}
														>
															{pct}%
														</span>
													) : (
														"—"
													)}
												</TableCell>
												<TableCell>
													<Badge
														variant={worker.is_active ? "default" : "outline"}
													>
														{worker.is_active ? "Active" : "Inactive"}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1">
														<Dialog
															open={editWorker?.id === worker.id}
															onOpenChange={(open) =>
																setEditWorker(open ? worker : null)
															}
														>
															<DialogTrigger
																render={
																	<Button variant="ghost" size="icon-sm">
																		<PencilIcon />
																		<span className="sr-only">Edit</span>
																	</Button>
																}
															/>
															<DialogContent>
																<DialogHeader>
																	<DialogTitle>Edit Worker</DialogTitle>
																</DialogHeader>
																<WorkerForm
																	defaultValues={
																		{
																			id: worker.id,
																			full_name: worker.full_name,
																			phone: worker.phone ?? "",
																			zone_assigned: worker.zone_assigned ?? "",
																			daily_target: worker.daily_target ?? 10,
																			pin: worker.pin ?? "",
																		} as WorkerDefaults
																	}
																	onSuccess={() => {
																		setEditWorker(null);
																		fetchWorkers();
																	}}
																/>
															</DialogContent>
														</Dialog>

														<Button
															variant="ghost"
															size="icon-sm"
															onClick={() => toggleActive(worker)}
															title={
																worker.is_active ? "Deactivate" : "Reactivate"
															}
														>
															<PowerIcon />
															<span className="sr-only">
																{worker.is_active ? "Deactivate" : "Reactivate"}
															</span>
														</Button>
													</div>
												</TableCell>
											</TableRow>
										);
									})
								) : (
									<TableRow>
										<TableCell
											colSpan={6}
											className="h-24 text-center text-muted-foreground"
										>
											No workers found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			) : null}
		</div>
	);
}
