"use client";

import { DownloadIcon, SearchIcon } from "lucide-react";
import * as React from "react";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";

type Submission = {
	id: string;
	stand_number: string | null;
	zone: string | null;
	status: string | null;
	collected_at: string | null;
	worker_id: string | null;
	extra_fields: Record<string, unknown> | null;
	[key: string]: unknown;
};

type Worker = {
	id: string;
	full_name: string;
	zone_assigned: string | null;
};

export default function ExportPage() {
	const [dateFrom, setDateFrom] = React.useState("");
	const [dateTo, setDateTo] = React.useState("");
	const [workerFilter, setWorkerFilter] = React.useState("all");
	const [zoneFilter, setZoneFilter] = React.useState("all");
	const [statusFilter, setStatusFilter] = React.useState("all");
	const [workers, setWorkers] = React.useState<Worker[]>([]);
	const [zones, setZones] = React.useState<string[]>([]);
	const [previewData, setPreviewData] = React.useState<Submission[]>([]);
	const [previewCount, setPreviewCount] = React.useState<number | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [downloading, setDownloading] = React.useState(false);

	React.useEffect(() => {
		async function loadFilters() {
			const supabase = createClient();
			const { data: workerData } = await supabase
				.from("users")
				.select("id, full_name, zone_assigned")
				.eq("role", "worker")
				.order("full_name");
			if (workerData) setWorkers(workerData);

			const { data: zoneData } = await supabase
				.from("submissions")
				.select("zone")
				.not("zone", "is", null);
			if (zoneData) {
				const unique = [...new Set(zoneData.map((r) => r.zone as string))]
					.filter(Boolean)
					.sort();
				setZones(unique);
			}
		}
		loadFilters();
	}, []);

	function buildFilteredQuery() {
		const supabase = createClient();
		let query = supabase
			.from("submissions")
			.select("*, users!worker_id(full_name)")
			.order("collected_at", { ascending: false });

		if (dateFrom) query = query.gte("collected_at", dateFrom);
		if (dateTo) query = query.lte("collected_at", `${dateTo}T23:59:59`);
		if (workerFilter !== "all") query = query.eq("worker_id", workerFilter);
		if (zoneFilter !== "all") query = query.eq("zone", zoneFilter);
		if (statusFilter !== "all") query = query.eq("status", statusFilter);

		return query;
	}

	async function handlePreview() {
		setLoading(true);
		try {
			const { data, error } = await buildFilteredQuery().limit(5);
			if (error) throw error;
			setPreviewData((data as Submission[]) ?? []);

			const supabase = createClient();
			let countQuery = supabase
				.from("submissions")
				.select("id", { count: "exact", head: true });
			if (dateFrom) countQuery = countQuery.gte("collected_at", dateFrom);
			if (dateTo)
				countQuery = countQuery.lte("collected_at", `${dateTo}T23:59:59`);
			if (workerFilter !== "all")
				countQuery = countQuery.eq("worker_id", workerFilter);
			if (zoneFilter !== "all") countQuery = countQuery.eq("zone", zoneFilter);
			if (statusFilter !== "all")
				countQuery = countQuery.eq("status", statusFilter);
			const { count: total } = await countQuery;
			setPreviewCount(total ?? 0);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	async function handleDownload() {
		setDownloading(true);
		try {
			const { data, error } = await buildFilteredQuery();
			if (error) throw error;
			const rows = data as Submission[];

			const extraKeys = new Set<string>();
			rows.forEach((r) => {
				if (r.extra_fields && typeof r.extra_fields === "object") {
					Object.keys(r.extra_fields).forEach((k) => {
						extraKeys.add(k);
					});
				}
			});

			const flatRows = rows.map((r) => {
				const base: Record<string, unknown> = {
					id: r.id,
					stand_number: r.stand_number,
					zone: r.zone,
					status: r.status,
					collected_at: r.collected_at,
					worker_id: r.worker_id,
					worker_name: r.users
						? (r.users as { full_name: string })?.full_name
						: null,
				};
				extraKeys.forEach((k) => {
					base[`extra_${k}`] = r.extra_fields
						? (r.extra_fields as Record<string, unknown>)[k]
						: null;
				});
				return base;
			});

			const ws = XLSX.utils.json_to_sheet(flatRows);
			const colWidths = Object.keys(flatRows[0] ?? {}).map((key) => {
				const maxLen = Math.max(
					key.length,
					...flatRows.map((r) => String(r[key] ?? "").length),
				);
				return { wch: Math.min(maxLen + 2, 40) };
			});
			ws["!cols"] = colWidths;

			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Submissions");
			XLSX.writeFile(
				wb,
				`submissions_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
			);
		} catch (err) {
			console.error(err);
		} finally {
			setDownloading(false);
		}
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<div>
				<h1 className="text-lg sm:text-2xl font-bold tracking-tight">
					Export Data
				</h1>
				<p className="text-xs sm:text-sm text-muted-foreground">
					Filter submissions and download as Excel.
				</p>
			</div>

			<Card>
				<CardHeader className="p-3 sm:p-6">
					<CardTitle className="text-sm sm:text-base">Filters</CardTitle>
				</CardHeader>
				<CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
					<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
						<div className="space-y-1.5">
							<Label>Date From</Label>
							<Input
								type="date"
								value={dateFrom}
								onChange={(e) => setDateFrom(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Date To</Label>
							<Input
								type="date"
								value={dateTo}
								onChange={(e) => setDateTo(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Worker</Label>
							<Select
								value={workerFilter}
								onValueChange={(v) => setWorkerFilter(v ?? "all")}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="All Workers" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Workers</SelectItem>
									{workers.map((w) => (
										<SelectItem key={w.id} value={w.id}>
											{w.full_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>Zone</Label>
							<Select
								value={zoneFilter}
								onValueChange={(v) => setZoneFilter(v ?? "all")}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="All Zones" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Zones</SelectItem>
									{zones.map((z) => (
										<SelectItem key={z} value={z}>
											{z}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>Status</Label>
							<Select
								value={statusFilter}
								onValueChange={(v) => setStatusFilter(v ?? "all")}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="All Statuses" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="complete">Complete</SelectItem>
									<SelectItem value="flagged">Flagged</SelectItem>
									<SelectItem value="disputed">Disputed</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-5">
						<Button
							onClick={handlePreview}
							disabled={loading}
							variant="outline"
							className="w-full sm:w-auto"
						>
							<SearchIcon className="w-4 h-4 mr-2" />
							{loading ? "Loading..." : "Preview"}
						</Button>
						<Button
							onClick={handleDownload}
							disabled={downloading}
							className="w-full sm:w-auto"
						>
							<DownloadIcon className="w-4 h-4 mr-2" />
							{downloading ? "Downloading..." : "Download Excel"}
						</Button>
					</div>
				</CardContent>
			</Card>

			{previewCount !== null && (
				<Card>
					<CardHeader className="p-3 sm:p-6">
						<CardTitle className="text-sm sm:text-base">
							Preview{" "}
							<span className="text-muted-foreground font-normal text-xs sm:text-base">
								({previewCount} total rows, showing first {previewData.length})
							</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
						{previewData.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No submissions match the selected filters.
							</p>
						) : (
							<div className="overflow-x-auto">
								<Table className="text-xs sm:text-sm">
									<TableHeader>
										<TableRow>
											<TableHead>Stand</TableHead>
											<TableHead className="hidden sm:table-cell">
												Zone
											</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Worker</TableHead>
											<TableHead className="hidden sm:table-cell">
												Collected At
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{previewData.map((row) => (
											<TableRow key={row.id}>
												<TableCell>{row.stand_number ?? "—"}</TableCell>
												<TableCell className="hidden sm:table-cell">
													{row.zone ?? "—"}
												</TableCell>
												<TableCell>
													<Badge variant="outline">{row.status ?? "—"}</Badge>
												</TableCell>
												<TableCell>
													{row.users
														? (row.users as { full_name: string })?.full_name
														: (row.worker_id ?? "—")}
												</TableCell>
												<TableCell className="hidden sm:table-cell">
													{row.collected_at
														? new Date(row.collected_at).toLocaleString()
														: "—"}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
