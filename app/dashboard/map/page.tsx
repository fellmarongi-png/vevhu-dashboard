"use client";

import { AlertCircle, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const SubmissionsMap = dynamic(
	() =>
		import("@/components/map/submissions-map").then((m) => m.SubmissionsMap),
	{
		ssr: false,
		loading: () => (
			<div className="flex-1 flex items-center justify-center text-muted-foreground">
				Loading map...
			</div>
		),
	},
);

interface Submission {
	id: string;
	stand_number: string;
	worker_id: string;
	worker_name: string;
	created_at: string;
	status: "complete" | "pending" | "flagged";
	latitude: number;
	longitude: number;
}

type SubmissionRow = {
	id: string;
	stand_number_official?: string;
	worker_id: string;
	created_at: string;
	status?: string;
	gps_latitude?: number | null;
	gps_longitude?: number | null;
	users?: { full_name?: string } | null;
};

const STATUS_OPTIONS = ["all", "complete", "pending", "flagged"] as const;

export default function MapPage() {
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [filtered, setFiltered] = useState<Submission[]>([]);
	const [workers, setWorkers] = useState<{ id: string; name: string }[]>([]);

	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [workerFilter, setWorkerFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [truncated, setTruncated] = useState(false);

	useEffect(() => {
		async function fetchSubmissions() {
			const supabase = createClient();

			const { data, error } = await supabase
				.from("submissions")
				.select(
					"id, stand_number_official, worker_id, created_at, status, gps_latitude, gps_longitude, users!worker_id(full_name)",
				)
				.not("gps_latitude", "is", null)
				.not("gps_longitude", "is", null)
				.limit(500);

			if (error) {
				setError(error.message);
				setLoading(false);
				return;
			}

			const rows = (data as SubmissionRow[] | null) ?? [];
			if (rows.length >= 500) {
				setTruncated(true);
			}
			const parsed: Submission[] = rows
				.filter((r) => r.gps_latitude != null && r.gps_longitude != null)
				.map((r) => ({
					id: r.id,
					stand_number: r.stand_number_official ?? "—",
					worker_id: r.worker_id,
					worker_name: r.users?.full_name ?? r.worker_id,
					created_at: r.created_at,
					status: (r.status as Submission["status"]) ?? "pending",
					latitude: r.gps_latitude!,
					longitude: r.gps_longitude!,
				}));

			setSubmissions(parsed);
			setFiltered(parsed);

			const workerMap = new globalThis.Map<string, string>();
			parsed.forEach((s) => workerMap.set(s.worker_id, s.worker_name));
			setWorkers(
				Array.from(workerMap.entries()).map(([id, name]) => ({ id, name })),
			);

			setLoading(false);
		}

		fetchSubmissions();
	}, []);

	const applyFilters = useCallback(() => {
		let result = submissions;

		if (dateFrom) {
			result = result.filter((s) => s.created_at >= dateFrom);
		}
		if (dateTo) {
			result = result.filter((s) => s.created_at <= `${dateTo}T23:59:59`);
		}
		if (workerFilter !== "all") {
			result = result.filter((s) => s.worker_id === workerFilter);
		}
		if (statusFilter !== "all") {
			result = result.filter((s) => s.status === statusFilter);
		}

		setFiltered(result);
	}, [submissions, dateFrom, dateTo, workerFilter, statusFilter]);

	useEffect(() => {
		applyFilters();
	}, [applyFilters]);

	return (
		<div className="flex flex-col h-full -m-3 sm:-m-6">
			{/* Filter bar */}
			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 px-3 sm:px-6 py-3 border-b bg-card z-10">
				<span className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground">
					<MapPin className="size-3.5" /> Filters
				</span>

				<div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
					<Input
						type="date"
						value={dateFrom}
						onChange={(e) => setDateFrom(e.target.value)}
						className="h-8 text-xs sm:text-sm w-full sm:w-auto"
						placeholder="From"
					/>
					<Input
						type="date"
						value={dateTo}
						onChange={(e) => setDateTo(e.target.value)}
						className="h-8 text-xs sm:text-sm w-full sm:w-auto"
						placeholder="To"
					/>
				</div>

				<div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
					<Select
						value={workerFilter}
						onValueChange={(v) => setWorkerFilter(v ?? "all")}
					>
						<SelectTrigger className="w-full sm:w-40">
							<SelectValue placeholder="All workers" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All workers</SelectItem>
							{workers.map((w) => (
								<SelectItem key={w.id} value={w.id}>
									{w.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={statusFilter}
						onValueChange={(v) => setStatusFilter(v ?? "all")}
					>
						<SelectTrigger className="w-full sm:w-36">
							<SelectValue placeholder="All statuses" />
						</SelectTrigger>
						<SelectContent>
							{STATUS_OPTIONS.map((s) => (
								<SelectItem key={s} value={s}>
									{s === "all"
										? "All statuses"
										: s.charAt(0).toUpperCase() + s.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center justify-between sm:justify-start sm:ml-auto gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs"
						onClick={() => {
							setDateFrom("");
							setDateTo("");
							setWorkerFilter("all");
							setStatusFilter("all");
						}}
					>
						Reset
					</Button>

					<span className="ml-auto text-xs font-medium tabular-nums text-muted-foreground">
						{loading
							? "Loading..."
							: `${filtered.length} marker${filtered.length !== 1 ? "s" : ""}`}
					</span>
				</div>
			</div>

			{/* Truncation notice */}
			{truncated && (
				<div className="px-6 py-2">
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Showing first 500 markers. Use filters to narrow results.
						</AlertDescription>
					</Alert>
				</div>
			)}

			{/* Error */}
			{error && (
				<div className="px-6 py-3">
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Error loading map data</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				</div>
			)}

			{/* Map */}
			<div className="flex-1 relative">
				{!error && <SubmissionsMap submissions={filtered} />}
			</div>
		</div>
	);
}
