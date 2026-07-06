import { format } from "date-fns";
import {
	FileTextIcon,
	ImageIcon,
	HistoryIcon,
	MapPinIcon,
	MicIcon,
	PenToolIcon,
} from "lucide-react";
import { notFound } from "next/navigation";
import { SubmissionStatusSelect } from "@/components/submissions/submission-status-select";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	pending: "secondary",
	synced: "default",
	complete: "default",
	flagged: "destructive",
	disputed: "outline",
};

export default async function SubmissionDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const supabase = await createServerSupabaseClient();

	const [subRes, editsRes] = await Promise.all([
		supabase
			.from("submissions")
			.select("*, users!worker_id(full_name)")
			.eq("id", id)
			.single(),
		supabase
			.from("submission_edits")
			.select("*")
			.eq("submission_id", id)
			.order("edited_at", { ascending: false }),
	]);

	if (subRes.error || !subRes.data) {
		notFound();
	}

	const submission = subRes.data;
	const edits = editsRes.data ?? [];

	const photos: string[] = submission.photos ?? [];
	const audioUrl: string | null = submission.audio_recording_key ?? null;
	const signatureUrl: string | null = submission.signature_key ?? null;
	const gpsLat: number | null = submission.gps_latitude ?? null;
	const gpsLng: number | null = submission.gps_longitude ?? null;

	// Safe extra_fields extraction
	let parsedExtraFields: Record<string, unknown> = {};
	if (
		typeof submission.extra_fields === "object" &&
		submission.extra_fields !== null
	) {
		parsedExtraFields = submission.extra_fields as Record<string, unknown>;
	} else if (typeof submission.extra_fields === "string") {
		try {
			parsedExtraFields = JSON.parse(submission.extra_fields || "{}");
		} catch {
			parsedExtraFields = {};
		}
	}

	const nationalId =
		submission.respondent_national_id ||
		(parsedExtraFields.respondent_national_id as string) ||
		"—";

	// Collect form fields (exclude known top-level fields)
	const excludeKeys = new Set([
		"id",
		"worker_id",
		"stand_number_official",
		"stand_number_physical",
		"respondent_name",
		"respondent_type",
		"respondent_phone",
		"respondent_national_id",
		"is_legal_owner",
		"owner_name",
		"owner_phone",
		"account_standing",
		"action_taken",
		"field_notes",
		"status",
		"collected_at",
		"photos",
		"audio_recording_key",
		"audio_duration_seconds",
		"signature_key",
		"gps_latitude",
		"gps_longitude",
		"gps_accuracy",
		"created_at",
		"updated_at",
		"synced_at",
		"users",
		"form_schema_version",
		"extra_fields",
	]);

	const formFields = Object.entries(submission).filter(
		([key]) => !excludeKeys.has(key),
	);

	const extraFields = Object.entries(parsedExtraFields).filter(
		([key]) => !excludeKeys.has(key),
	);

	return (
		<div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
			{/* Header */}
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold tracking-tight">
						Submission Detail
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm font-mono truncate">
						{id}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge
						variant={
							STATUS_COLORS[submission.status ?? "pending"] ?? "secondary"
						}
					>
						{submission.status ?? "pending"}
					</Badge>
					<SubmissionStatusSelect
						id={id}
						currentStatus={submission.status ?? "pending"}
					/>
				</div>
			</div>

			{/* Core Overview Card */}
			<Card>
				<CardHeader className="p-3 sm:p-6">
					<CardTitle className="text-sm sm:text-base">
						Stand & Respondent Overview
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Field Worker
						</p>
						<p className="font-medium">
							{submission.users?.full_name ?? submission.worker_id}
						</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Official Stand #
						</p>
						<p className="font-medium">
							{submission.stand_number_official ?? "—"}
						</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							On-Site Physical Stand #
						</p>
						<p className="font-medium">
							{submission.stand_number_physical ?? "—"}
						</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Respondent Name
						</p>
						<p className="font-medium">{submission.respondent_name ?? "—"}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Respondent Phone
						</p>
						<p className="font-medium">{submission.respondent_phone ?? "—"}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Respondent National ID
						</p>
						<p className="font-medium font-mono">{nationalId}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Respondent Type
						</p>
						<p className="font-medium">{submission.respondent_type ?? "—"}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Is Registered Owner?
						</p>
						<p className="font-medium">
							{submission.is_legal_owner
								? "Yes (Owner)"
								: "No (Tenant/Caretaker)"}
						</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Legal Owner Name
						</p>
						<p className="font-medium">
							{submission.owner_name || submission.respondent_name || "—"}
						</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Legal Owner Phone
						</p>
						<p className="font-medium">
							{submission.owner_phone || submission.respondent_phone || "—"}
						</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Rates Account Standing
						</p>
						<p className="font-medium">{submission.account_standing ?? "—"}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Action / Notice Served
						</p>
						<p className="font-medium">{submission.action_taken ?? "None"}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Collected At
						</p>
						<p className="font-medium">
							{submission.collected_at
								? format(new Date(submission.collected_at), "dd MMM yyyy HH:mm")
								: "—"}
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Field Notes Card */}
			{submission.field_notes && (
				<Card>
					<CardHeader className="p-3 sm:p-6">
						<CardTitle className="text-sm sm:text-base flex items-center gap-2">
							<FileTextIcon className="size-4" /> Field Notes & Observations
						</CardTitle>
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
						<p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground bg-muted/40 p-3 rounded-lg border">
							{submission.field_notes}
						</p>
					</CardContent>
				</Card>
			)}

			{/* Dynamic & Extra Fields */}
			{(formFields.length > 0 || extraFields.length > 0) && (
				<Card>
					<CardHeader className="p-3 sm:p-6">
						<CardTitle className="text-sm sm:text-base">
							Dynamic Custom Fields
						</CardTitle>
						<CardDescription className="text-xs sm:text-sm">
							Additional schema and custom survey responses
						</CardDescription>
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
						{formFields.map(([key, value]) => (
							<div key={key}>
								<p className="text-xs text-muted-foreground uppercase tracking-wide">
									{key.replace(/_/g, " ")}
								</p>
								<p className="font-medium break-words">
									{value == null ? "—" : String(value)}
								</p>
							</div>
						))}
						{extraFields.map(([key, value]) => (
							<div key={key}>
								<p className="text-xs text-muted-foreground uppercase tracking-wide">
									{key.replace(/_/g, " ")}
								</p>
								<p className="font-medium break-words">
									{value == null ? "—" : String(value)}
								</p>
							</div>
						))}
					</CardContent>
				</Card>
			)}

			{/* Photo gallery */}
			{photos.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ImageIcon className="size-4" /> Photos ({photos.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
							{photos.map((url) => (
								<a
									key={url}
									href={url}
									target="_blank"
									rel="noopener noreferrer"
									className="block aspect-square overflow-hidden rounded-lg border ring-1 ring-foreground/10 hover:opacity-90 transition-opacity"
								>
									{/* biome-ignore lint/performance/noImgElement: External user uploaded media */}
									<img
										src={url}
										alt="Stand document evidence"
										className="h-full w-full object-cover"
									/>
								</a>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Audio */}
			{audioUrl && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<MicIcon className="size-4" /> Audio Recording
						</CardTitle>
					</CardHeader>
					<CardContent>
						{/* biome-ignore lint/a11y/useMediaCaption: Audio preview of field interview */}
						<audio controls className="w-full" src={audioUrl}>
							Your browser does not support the audio element.
						</audio>
					</CardContent>
				</Card>
			)}

			{/* Signature */}
			{signatureUrl && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PenToolIcon className="size-4" /> Signature
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="rounded-lg border bg-white p-2 ring-1 ring-foreground/10 inline-block">
							{/* biome-ignore lint/performance/noImgElement: User signature canvas image */}
							<img
								src={signatureUrl}
								alt="Resident signature capture"
								className="max-h-40 object-contain"
							/>
						</div>
					</CardContent>
				</Card>
			)}

			{/* GPS mini-map */}
			{gpsLat !== null && gpsLng !== null && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<MapPinIcon className="size-4" /> Location
						</CardTitle>
						<CardDescription>
							{gpsLat.toFixed(6)}, {gpsLng.toFixed(6)}
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0 overflow-hidden rounded-b-xl">
						<iframe
							title="GPS location"
							width="100%"
							height="240"
							style={{ border: 0 }}
							src={`https://www.openstreetmap.org/export/embed.html?bbox=${gpsLng - 0.005}%2C${gpsLat - 0.005}%2C${gpsLng + 0.005}%2C${gpsLat + 0.005}&layer=mapnik&marker=${gpsLat}%2C${gpsLng}`}
						/>
					</CardContent>
				</Card>
			)}

			{/* Audit Trail / Edit History */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<HistoryIcon className="size-4 text-primary" /> Audit Trail & Worker Edit History ({edits.length})
					</CardTitle>
					<CardDescription>
						Complete record of modifications submitted by field workers for audit compliance.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{edits.length === 0 ? (
						<p className="text-xs text-muted-foreground py-2">
							No edits recorded for this submission. Initial survey entry is original and un-modified.
						</p>
					) : (
						<div className="space-y-4">
							{edits.map((edit: { id: string; edited_by_worker_name?: string; edited_at: string; edit_reason?: string; updated_data: unknown }) => (
								<div key={edit.id} className="p-3 rounded-lg border bg-muted/40 space-y-2 text-xs">
									<div className="flex items-center justify-between font-semibold">
										<span>👤 Edited by {edit.edited_by_worker_name || "Field Agent"}</span>
										<span className="text-muted-foreground font-normal">
											{format(new Date(edit.edited_at), "MMM d, yyyy h:mm a")}
										</span>
									</div>
									{edit.edit_reason && (
										<p className="text-muted-foreground italic">
											Reason: &quot;{edit.edit_reason}&quot;
										</p>
									)}
									<div className="bg-background p-2 rounded border text-[11px]">
										<p className="font-medium mb-1 text-primary">Modifications Captured:</p>
										<pre className="whitespace-pre-wrap overflow-x-auto text-[10px] text-muted-foreground">
											{JSON.stringify(edit.updated_data, null, 2)}
										</pre>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
