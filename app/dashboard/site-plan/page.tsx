"use client";

import { AlertCircle, CheckCircle2, MapPin, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface StandPreset {
	stand_number: string;
	xPercent: number;
	yPercent: number;
}

const LOT6_STANDS: StandPreset[] = [
	{ stand_number: "1042", xPercent: 42.5, yPercent: 35.2 },
	{ stand_number: "1042-B", xPercent: 44.1, yPercent: 36.8 },
	{ stand_number: "1043", xPercent: 48.0, yPercent: 38.0 },
	{ stand_number: "1044", xPercent: 52.3, yPercent: 40.5 },
	{ stand_number: "1045", xPercent: 55.8, yPercent: 43.1 },
	{ stand_number: "1046", xPercent: 60.2, yPercent: 46.4 },
	{ stand_number: "1047", xPercent: 64.0, yPercent: 50.0 },
	{ stand_number: "1048", xPercent: 68.5, yPercent: 53.2 },
];

interface SubmissionRecord {
	id: string;
	stand_number_official: string | null;
	stand_number_physical: string | null;
	respondent_name: string | null;
	respondent_phone: string | null;
	owner_name: string | null;
	account_standing: string | null;
	status: string;
	collected_at: string;
}

export default function SpitzkopSitePlanPage() {
	const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedStand, setSelectedStand] = useState<StandPreset | null>(LOT6_STANDS[0]);

	async function fetchSubmissions() {
		setLoading(true);
		const supabase = createClient();
		const { data } = await supabase
			.from("submissions")
			.select("id, stand_number_official, stand_number_physical, respondent_name, respondent_phone, owner_name, account_standing, status, collected_at")
			.order("collected_at", { ascending: false });

		if (data) {
			setSubmissions(data as SubmissionRecord[]);
		}
		setLoading(false);
	}

	useEffect(() => {
		fetchSubmissions();
	}, []);

	const selectedSubmission = useMemo(() => {
		if (!selectedStand) return null;
		return submissions.find(
			(s) =>
				s.stand_number_official === selectedStand.stand_number ||
				s.stand_number_physical === selectedStand.stand_number,
		);
	}, [selectedStand, submissions]);

	const collectedCount = useMemo(() => {
		return LOT6_STANDS.filter((stand) =>
			submissions.some(
				(s) =>
					s.stand_number_official === stand.stand_number ||
					s.stand_number_physical === stand.stand_number,
			),
		).length;
	}, [submissions]);

	return (
		<div className="space-y-6">
			{/* Top Bar Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight">
							Spitzkop Lot 6 Cadastral Plan
						</h1>
						<Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 font-semibold">
							Lot 6 Triangle Focus
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						Interactive land audit survey drawing, live stand boundary overlays & on-ground verification inspector
					</p>
				</div>
				<Button onClick={fetchSubmissions} variant="outline" className="gap-2 self-start sm:self-auto">
					<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					Refresh Field Data
				</Button>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
							Total Lot 6 Stands
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{LOT6_STANDS.length} Stands</div>
						<p className="text-xs text-muted-foreground">Surveyed subdivision grid</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
							Verified Collections
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-emerald-600">
							{collectedCount} / {LOT6_STANDS.length}
						</div>
						<p className="text-xs text-muted-foreground">
							{Math.round((collectedCount / LOT6_STANDS.length) * 100)}% completion rate
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
							Pending Verification
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-amber-600">
							{LOT6_STANDS.length - collectedCount} Stands
						</div>
						<p className="text-xs text-muted-foreground">Awaiting field agent visit</p>
					</CardContent>
				</Card>
			</div>

			{/* Interactive Map & Inspector Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Map Drawing Container */}
				<Card className="lg:col-span-2 overflow-hidden border">
					<CardHeader className="p-4 bg-muted/40 flex flex-row items-center justify-between border-b">
						<div className="flex items-center gap-2">
							<MapPin className="h-5 w-5 text-primary" />
							<CardTitle className="text-sm font-semibold">
								Spitzkop Lot 6 Cadastral Blueprint
							</CardTitle>
						</div>
						<span className="text-xs text-muted-foreground font-mono">
							PDF Source: SPITZKOP LOT 14.pdf
						</span>
					</CardHeader>
					<CardContent className="p-0 relative bg-[#F4F1EA]">
						<div className="relative w-full h-[520px] overflow-hidden flex items-center justify-center">
							<img
								src="/maps/spitzkop_lot6_triangle.png"
								alt="Spitzkop Lot 6 Cadastral Plan"
								className="w-full h-full object-contain"
							/>

							{/* Interactive Pins Overlay */}
							{LOT6_STANDS.map((stand) => {
								const isCollected = submissions.some(
									(s) =>
										s.stand_number_official === stand.stand_number ||
										s.stand_number_physical === stand.stand_number,
								);
								const isSelected = selectedStand?.stand_number === stand.stand_number;

								return (
									<button
										key={stand.stand_number}
										type="button"
										onClick={() => setSelectedStand(stand)}
										style={{
											left: `${stand.xPercent}%`,
											top: `${stand.yPercent}%`,
										}}
										className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md text-xs font-bold shadow-md transition-all ${
											isSelected
												? "bg-primary text-white ring-4 ring-primary/30 z-20 scale-110"
												: isCollected
													? "bg-emerald-600 text-white hover:bg-emerald-700 z-10"
													: "bg-white text-stone-800 border border-stone-300 hover:border-primary z-10"
										}`}
									>
										#{stand.stand_number}
									</button>
								);
							})}
						</div>
					</CardContent>
				</Card>

				{/* Stand Inspector Sidebar */}
				<div className="space-y-4">
					<Card>
						<CardHeader className="p-4 pb-3 border-b">
							<CardTitle className="text-sm font-semibold flex items-center gap-2">
								<Search className="h-4 w-4 text-muted-foreground" />
								Stand Inspection Detail
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 space-y-4">
							{selectedStand ? (
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<h3 className="text-xl font-bold">Stand #{selectedStand.stand_number}</h3>
											<p className="text-xs text-muted-foreground">Spitzkop Lot 6 Triangle Zone</p>
										</div>
										{selectedSubmission ? (
											<Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
												<CheckCircle2 className="h-3 w-3 mr-1" /> Verified
											</Badge>
										) : (
											<Badge variant="outline" className="text-amber-600 border-amber-300">
												<AlertCircle className="h-3 w-3 mr-1" /> Uncollected
											</Badge>
										)}
									</div>

									{selectedSubmission ? (
										<div className="space-y-3 pt-2 text-sm border-t">
											<div>
												<p className="text-xs text-muted-foreground uppercase font-semibold">Respondent Name</p>
												<p className="font-medium">{selectedSubmission.respondent_name || "N/A"}</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground uppercase font-semibold">Contact Phone</p>
												<p className="font-medium">{selectedSubmission.respondent_phone || "N/A"}</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground uppercase font-semibold">Registered Owner</p>
												<p className="font-medium">{selectedSubmission.owner_name || "Same as respondent"}</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground uppercase font-semibold">Rates Standing</p>
												<p className="font-medium">{selectedSubmission.account_standing || "Up to date"}</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground uppercase font-semibold">Collected Date</p>
												<p className="font-medium">
													{selectedSubmission.collected_at
														? new Date(selectedSubmission.collected_at).toLocaleDateString()
														: "Recently"}
												</p>
											</div>
										</div>
									) : (
										<div className="p-4 bg-muted/30 rounded-lg text-center text-xs text-muted-foreground space-y-1">
											<p className="font-medium text-stone-700">No field collection record found for this stand.</p>
											<p>Assign a field worker on the mobile app to collect on-site data.</p>
										</div>
									)}
								</div>
							) : (
								<p className="text-sm text-muted-foreground text-center py-6">
									Select a stand pin on the map drawing above to inspect details.
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
