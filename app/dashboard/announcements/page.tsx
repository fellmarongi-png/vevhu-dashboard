"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MegaphoneIcon, PlusIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

type Announcement = {
	id: string;
	title: string;
	message: string;
	target_type: "all" | "worker" | "zone";
	target_worker_id: string | null;
	target_zone: string | null;
	created_at: string;
	read_by: string[] | null;
	total_target: number | null;
};

type Worker = {
	id: string;
	full_name: string;
	zone_assigned: string | null;
};

const announcementSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		message: z.string().min(1, "Message is required"),
		target_type: z.enum(["all", "worker", "zone"]),
		target_worker: z.string().optional(),
		target_zone: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.target_type === "worker" && !data.target_worker) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Please select a worker.",
				path: ["target_worker"],
			});
		}
		if (data.target_type === "zone" && !data.target_zone) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Please select a zone.",
				path: ["target_zone"],
			});
		}
	});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function AnnouncementsPage() {
	const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
	const [workers, setWorkers] = React.useState<Worker[]>([]);
	const [zones, setZones] = React.useState<string[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [serverError, setServerError] = React.useState<string | null>(null);

	const {
		register,
		handleSubmit,
		control,
		watch,
		reset,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<AnnouncementFormValues>({
		resolver: zodResolver(announcementSchema),
		defaultValues: {
			title: "",
			message: "",
			target_type: "all",
			target_worker: "",
			target_zone: "",
		},
	});

	const targetType = watch("target_type");

	async function fetchData() {
		const supabase = createClient();
		const { data: ann } = await supabase
			.from("announcements")
			.select("*")
			.order("created_at", { ascending: false });
		if (ann) setAnnouncements(ann as Announcement[]);

		const { data: workerData } = await supabase
			.from("users")
			.select("id, full_name, zone_assigned")
			.eq("role", "worker")
			.order("full_name");
		if (workerData) setWorkers(workerData);

		const zoneSet = new Set<string>();
		workerData?.forEach((w) => {
			if (w.zone_assigned) zoneSet.add(w.zone_assigned);
		});
		setZones([...zoneSet].sort());

		setLoading(false);
	}

	React.useEffect(() => {
		fetchData();
	}, [fetchData]);

	function resetForm() {
		reset();
		setServerError(null);
	}

	async function onSubmit(values: AnnouncementFormValues) {
		setServerError(null);

		try {
			const supabase = createClient();

			let totalTarget = 0;
			if (values.target_type === "all") {
				const { count } = await supabase
					.from("users")
					.select("id", { count: "exact", head: true })
					.eq("role", "worker")
					.eq("is_active", true);
				totalTarget = count ?? 0;
			} else if (values.target_type === "zone") {
				const { count } = await supabase
					.from("users")
					.select("id", { count: "exact", head: true })
					.eq("role", "worker")
					.eq("is_active", true)
					.eq("zone_assigned", values.target_zone);
				totalTarget = count ?? 0;
			} else {
				totalTarget = 1;
			}

			const { error } = await supabase.from("announcements").insert({
				title: values.title.trim(),
				message: values.message.trim(),
				target_type: values.target_type,
				target_worker_id:
					values.target_type === "worker" ? values.target_worker : null,
				target_zone: values.target_type === "zone" ? values.target_zone : null,
				read_by: [],
				total_target: totalTarget,
			});

			if (error) throw error;

			setDialogOpen(false);
			resetForm();
			fetchData();
		} catch (err) {
			setServerError(String(err));
		}
	}

	function targetLabel(ann: Announcement) {
		if (ann.target_type === "all") return "All Workers";
		if (ann.target_type === "zone") return `Zone: ${ann.target_zone ?? "—"}`;
		const worker = workers.find((w) => w.id === ann.target_worker_id);
		return worker ? worker.full_name : (ann.target_worker_id ?? "—");
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-lg sm:text-2xl font-bold tracking-tight">
						Announcements
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground">
						Send messages to field agents.
					</p>
				</div>
				<Dialog
					open={dialogOpen}
					onOpenChange={(open) => {
						setDialogOpen(open);
						if (!open) resetForm();
					}}
				>
					<DialogTrigger
						render={
							<Button className="w-full sm:w-auto">
								<PlusIcon className="w-4 h-4 mr-2" />
								New Announcement
							</Button>
						}
					/>
					<DialogContent className="max-w-lg">
						<DialogHeader>
							<DialogTitle>New Announcement</DialogTitle>
						</DialogHeader>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
							<div className="space-y-1.5">
								<Label htmlFor="ann-title">Title</Label>
								<Input
									id="ann-title"
									placeholder="Announcement title"
									{...register("title")}
								/>
								{errors.title && (
									<p className="text-xs text-destructive">
										{errors.title.message}
									</p>
								)}
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="ann-message">Message</Label>
								<Textarea
									id="ann-message"
									placeholder="Write your announcement..."
									rows={4}
									{...register("message")}
								/>
								{errors.message && (
									<p className="text-xs text-destructive">
										{errors.message.message}
									</p>
								)}
							</div>
							<div className="space-y-1.5">
								<Label>Target</Label>
								<Controller
									control={control}
									name="target_type"
									render={({ field }) => (
										<RadioGroup
											value={field.value}
											onValueChange={(value) => {
												field.onChange(value);
												setValue("target_worker", "");
												setValue("target_zone", "");
											}}
											className="flex gap-4"
										>
											{(
												[
													{ value: "all", label: "All Workers" },
													{ value: "worker", label: "Specific Worker" },
													{ value: "zone", label: "Zone" },
												] as const
											).map((option) => (
												<label
													key={option.value}
													className="flex items-center gap-1.5 cursor-pointer text-sm"
												>
													<RadioGroupItem value={option.value} />
													{option.label}
												</label>
											))}
										</RadioGroup>
									)}
								/>
							</div>

							{targetType === "worker" && (
								<div className="space-y-1.5">
									<Label>Worker</Label>
									<Controller
										control={control}
										name="target_worker"
										render={({ field }) => (
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select worker" />
												</SelectTrigger>
												<SelectContent>
													{workers.map((w) => (
														<SelectItem key={w.id} value={w.id}>
															{w.full_name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
									{errors.target_worker && (
										<p className="text-xs text-destructive">
											{errors.target_worker.message}
										</p>
									)}
								</div>
							)}

							{targetType === "zone" && (
								<div className="space-y-1.5">
									<Label>Zone</Label>
									<Controller
										control={control}
										name="target_zone"
										render={({ field }) => (
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select zone" />
												</SelectTrigger>
												<SelectContent>
													{zones.map((z) => (
														<SelectItem key={z} value={z}>
															{z}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
									{errors.target_zone && (
										<p className="text-xs text-destructive">
											{errors.target_zone.message}
										</p>
									)}
								</div>
							)}

							{serverError && (
								<p className="text-sm text-destructive">{serverError}</p>
							)}

							<div className="flex justify-end gap-3 pt-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setDialogOpen(false);
										resetForm();
									}}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? "Sending..." : "Send Announcement"}
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardContent className="p-2 sm:p-6 pt-2 sm:pt-0">
					{loading ? (
						<p className="text-muted-foreground text-sm py-6">
							Loading announcements...
						</p>
					) : announcements.length === 0 ? (
						<div className="py-10 sm:py-16 text-center">
							<MegaphoneIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-muted-foreground/40" />
							<p className="text-sm text-muted-foreground">
								No announcements yet. Send your first one!
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table className="text-xs sm:text-sm">
								<TableHeader>
									<TableRow>
										<TableHead>Title</TableHead>
										<TableHead className="hidden sm:table-cell">
											Target
										</TableHead>
										<TableHead className="hidden sm:table-cell">Date</TableHead>
										<TableHead>Delivery</TableHead>
										<TableHead className="w-10"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{announcements.map((ann) => {
										const readCount = ann.read_by?.length ?? 0;
										const total = ann.total_target ?? 0;
										const pct =
											total > 0 ? Math.round((readCount / total) * 100) : 0;
										return (
											<TableRow key={ann.id}>
												<TableCell>
													<div>
														<p className="font-medium text-xs sm:text-sm">
															{ann.title}
														</p>
														<p className="text-[11px] sm:text-sm text-muted-foreground line-clamp-1">
															{ann.message}
														</p>
													</div>
												</TableCell>
												<TableCell className="hidden sm:table-cell">
													<Badge variant="outline">{targetLabel(ann)}</Badge>
												</TableCell>
												<TableCell className="hidden sm:table-cell text-muted-foreground text-xs sm:text-sm">
													{new Date(ann.created_at).toLocaleDateString()}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1 sm:gap-2">
														<span className="text-xs sm:text-sm font-medium">
															{readCount}/{total}
														</span>
														{total > 0 && (
															<div className="w-12 sm:w-20 h-1.5 bg-muted rounded-full overflow-hidden">
																<div
																	className="h-full bg-primary rounded-full"
																	style={{ width: `${pct}%` }}
																/>
															</div>
														)}
														<span className="text-[10px] sm:text-xs text-muted-foreground">
															{total > 0 ? `${pct}%` : "—"}
														</span>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1">
														<Button
															variant="ghost"
															size="sm"
															className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
															onClick={async () => {
																if (!confirm("Delete this announcement?"))
																	return;
																const supabase = createClient();
																await supabase
																	.from("announcements")
																	.delete()
																	.eq("id", ann.id);
																fetchData();
															}}
														>
															<Trash2Icon className="size-3.5 mr-1" />
															<span className="hidden sm:inline">Delete</span>
														</Button>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
