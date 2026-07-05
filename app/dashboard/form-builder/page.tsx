"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	AlignLeft,
	ChevronRight,
	GripVertical,
	Hash,
	List,
	Phone,
	Plus,
	Save,
	ToggleLeft,
	Trash2,
	Type,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

type FieldType =
	| "text"
	| "dropdown"
	| "toggle"
	| "phone"
	| "number"
	| "long_text";

interface FormField {
	id: string;
	type: FieldType;
	label: string;
	required: boolean;
	options?: string[]; // for dropdown
	condition?: string; // expression string
}

interface FormSection {
	id: string;
	title: string;
	script: string;
	fields: FormField[];
}

interface FormSchema {
	id?: string;
	version: number;
	sections: FormSection[];
}

// ─── Field palette ──────────────────────────────────────────────────────────

const FIELD_PALETTE: {
	type: FieldType;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}[] = [
	{ type: "text", label: "Short text", icon: Type },
	{ type: "long_text", label: "Long text", icon: AlignLeft },
	{ type: "number", label: "Number", icon: Hash },
	{ type: "phone", label: "Phone", icon: Phone },
	{ type: "dropdown", label: "Dropdown", icon: List },
	{ type: "toggle", label: "Toggle", icon: ToggleLeft },
];

const TYPE_ICONS: Record<
	FieldType,
	React.ComponentType<{ className?: string }>
> = {
	text: Type,
	long_text: AlignLeft,
	number: Hash,
	phone: Phone,
	dropdown: List,
	toggle: ToggleLeft,
};

// ─── Sortable field row ──────────────────────────────────────────────────────

function SortableFieldRow({
	field,
	isSelected,
	onSelect,
	onDelete,
}: {
	field: FormField;
	isSelected: boolean;
	onSelect: () => void;
	onDelete: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: field.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const Icon = TYPE_ICONS[field.type];

	return (
		/* biome-ignore lint/a11y/useSemanticElements: draggable field item container */
		<div
			role="button"
			tabIndex={0}
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
				isSelected
					? "border-ring bg-accent"
					: "border-border hover:bg-accent/50"
			}`}
			onClick={onSelect}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onSelect();
				}
			}}
		>
			<button
				{...attributes}
				{...listeners}
				className="touch-none cursor-grab text-muted-foreground hover:text-foreground"
				onClick={(e) => e.stopPropagation()}
				type="button"
			>
				<GripVertical className="h-4 w-4" />
			</button>
			<Icon className="h-4 w-4 text-muted-foreground shrink-0" />
			<span className="flex-1 text-sm truncate">
				{field.label || "(no label)"}
			</span>
			{field.required && (
				<span className="text-destructive text-xs font-bold">*</span>
			)}
			<ChevronRight className="h-3 w-3 text-muted-foreground" />
			<button
				type="button"
				className="text-muted-foreground hover:text-destructive"
				onClick={(e) => {
					e.stopPropagation();
					onDelete();
				}}
			>
				<Trash2 className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}

// ─── Main page ───────────────────────────────────────────────────────────────

function generateId() {
	return crypto.randomUUID();
}

const DEFAULT_SECTION: FormSection = {
	id: generateId(),
	title: "Section 1",
	script: "",
	fields: [],
};

export default function FormBuilderPage() {
	const [schema, setSchema] = useState<FormSchema>({
		version: 1,
		sections: [DEFAULT_SECTION],
	});
	const [activeSectionIdx, setActiveSectionIdx] = useState(0);
	const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [saveMsg, setSaveMsg] = useState("");
	const [loading, setLoading] = useState(true);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	);

	// ─── Load active schema on mount ──────────────────────────────────────────

	useEffect(() => {
		async function load() {
			const supabase = createClient();
			const { data } = await supabase
				.from("form_schemas")
				.select("*")
				.eq("is_active", true)
				.order("version", { ascending: false })
				.limit(1)
				.maybeSingle();

			if (data) {
				setSchema({
					id: data.id as string,
					version: data.version as number,
					sections: ((data.fields ?? data.sections) as FormSection[]) ?? [DEFAULT_SECTION],
				});
			}
			setLoading(false);
		}
		load();
	}, []);

	// ─── Computed helpers ─────────────────────────────────────────────────────

	const activeSection = schema.sections[activeSectionIdx] ?? schema.sections[0];

	const selectedField =
		activeSection?.fields.find((f) => f.id === selectedFieldId) ?? null;

	// ─── Mutators ─────────────────────────────────────────────────────────────

	const updateSection = useCallback(
		(idx: number, patch: Partial<FormSection>) => {
			setSchema((prev) => {
				const sections = [...prev.sections];
				sections[idx] = { ...sections[idx], ...patch };
				return { ...prev, sections };
			});
		},
		[],
	);

	const updateField = useCallback(
		(fieldId: string, patch: Partial<FormField>) => {
			setSchema((prev) => {
				const sections = prev.sections.map((sec) => ({
					...sec,
					fields: sec.fields.map((f) =>
						f.id === fieldId ? { ...f, ...patch } : f,
					),
				}));
				return { ...prev, sections };
			});
		},
		[],
	);

	const addField = (type: FieldType) => {
		const newField: FormField = {
			id: generateId(),
			type,
			label: FIELD_PALETTE.find((p) => p.type === type)?.label ?? type,
			required: false,
			options: type === "dropdown" ? ["Option 1"] : undefined,
		};
		updateSection(activeSectionIdx, {
			fields: [...activeSection.fields, newField],
		});
		setSelectedFieldId(newField.id);
	};

	const deleteField = (fieldId: string) => {
		updateSection(activeSectionIdx, {
			fields: activeSection.fields.filter((f) => f.id !== fieldId),
		});
		if (selectedFieldId === fieldId) setSelectedFieldId(null);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = activeSection.fields.findIndex((f) => f.id === active.id);
		const newIndex = activeSection.fields.findIndex((f) => f.id === over.id);
		updateSection(activeSectionIdx, {
			fields: arrayMove(activeSection.fields, oldIndex, newIndex),
		});
	};

	const addSection = () => {
		const newSec: FormSection = {
			id: generateId(),
			title: `Section ${schema.sections.length + 1}`,
			script: "",
			fields: [],
		};
		setSchema((prev) => ({ ...prev, sections: [...prev.sections, newSec] }));
		setActiveSectionIdx(schema.sections.length);
		setSelectedFieldId(null);
	};

	// ─── Publish ──────────────────────────────────────────────────────────────
	// Uses a Supabase RPC that wraps deactivate + insert in a single transaction
	// to prevent the race condition where two concurrent publishes both succeed.
	// Required RPC: see supabase/migrations/20260701000000_publish_form_schema_rpc.sql

	const publish = async () => {
		setSaving(true);
		setSaveMsg("");
		const supabase = createClient();

		const newVersion = (schema.version ?? 0) + 1;

		const { data, error } = await supabase.rpc("publish_form_schema", {
			schema_sections: schema.sections,
			schema_version: newVersion,
		});

		if (error) {
			setSaveMsg(`Error: ${error.message}`);
		} else {
			setSchema((prev) => ({ ...prev, id: data, version: newVersion }));
			setSaveMsg("Published successfully");
			setTimeout(() => setSaveMsg(""), 3000);
		}
		setSaving(false);
	};

	// ─── Render ───────────────────────────────────────────────────────────────

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64 text-muted-foreground">
				Loading schema…
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full gap-3 sm:gap-4">
			{/* Header */}
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-lg sm:text-2xl font-bold tracking-tight">
						Form Builder
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Edit collection form fields
					</p>
				</div>
				<div className="flex items-center gap-2 sm:gap-3">
					{saveMsg && (
						<span className="text-xs sm:text-sm text-muted-foreground">
							{saveMsg}
						</span>
					)}
					<Button
						onClick={publish}
						disabled={saving}
						className="w-full sm:w-auto"
					>
						<Save className="h-4 w-4 mr-2" />
						{saving ? "Publishing…" : "Publish"}
					</Button>
				</div>
			</div>

			{/* Three-column layout — stacks on mobile */}
			<div className="grid grid-cols-1 md:grid-cols-[200px_1fr_280px] gap-3 sm:gap-4 flex-1 min-h-0">
				{/* ── Left: Palette ─────────────────────────────────────────────── */}
				<div className="flex flex-col gap-2 overflow-y-auto">
					<p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
						Field types
					</p>
					<div className="grid grid-cols-2 gap-1.5 md:grid-cols-1 md:gap-2">
						{FIELD_PALETTE.map(({ type, label, icon: Icon }) => (
							<button
								key={type}
								type="button"
								onClick={() => addField(type)}
								className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-xs sm:text-sm w-full text-left"
							>
								<Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
								{label}
								<Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-auto text-muted-foreground" />
							</button>
						))}
					</div>

					<div className="mt-4">
						<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
							Sections
						</p>
						{schema.sections.map((sec, idx) => (
							<button
								key={sec.id}
								type="button"
								onClick={() => {
									setActiveSectionIdx(idx);
									setSelectedFieldId(null);
								}}
								className={`flex items-center gap-1.5 w-full text-left px-3 py-1.5 rounded-md text-sm mb-1 transition-colors ${
									activeSectionIdx === idx
										? "bg-accent font-medium"
										: "hover:bg-accent/50"
								}`}
							>
								<span className="truncate">{sec.title}</span>
								<Badge variant="secondary" className="ml-auto text-xs shrink-0">
									{sec.fields.length}
								</Badge>
							</button>
						))}
						<Button
							variant="ghost"
							size="sm"
							onClick={addSection}
							className="w-full mt-1"
						>
							<Plus className="h-3.5 w-3.5 mr-1" />
							Add section
						</Button>
					</div>
				</div>

				{/* ── Center: Field list + Script editor ────────────────────────── */}
				<div className="flex flex-col gap-4 overflow-y-auto min-h-0">
					{/* Section meta */}
					<Card>
						<CardHeader className="pb-2 pt-4 px-4">
							<Input
								value={activeSection?.title ?? ""}
								onChange={(e) =>
									updateSection(activeSectionIdx, { title: e.target.value })
								}
								className="font-semibold text-base border-0 p-0 h-auto focus-visible:ring-0 shadow-none bg-transparent"
								placeholder="Section title"
							/>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							<Label className="text-xs text-muted-foreground mb-1 block">
								Talking script
							</Label>
							<Textarea
								value={activeSection?.script ?? ""}
								onChange={(e) =>
									updateSection(activeSectionIdx, { script: e.target.value })
								}
								placeholder="Enter the script the field worker should read for this section…"
								rows={3}
								className="resize-none text-sm"
							/>
						</CardContent>
					</Card>

					{/* Sortable field list */}
					<Card className="flex-1">
						<CardHeader className="pb-2 pt-4 px-4">
							<CardTitle className="text-sm">
								Fields
								<span className="ml-2 text-muted-foreground font-normal">
									({activeSection?.fields.length ?? 0})
								</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							{activeSection?.fields.length === 0 ? (
								<div className="border-2 border-dashed rounded-lg py-8 text-center text-sm text-muted-foreground">
									Click a field type on the left to add fields
								</div>
							) : (
								<DndContext
									sensors={sensors}
									collisionDetection={closestCenter}
									onDragEnd={handleDragEnd}
								>
									<SortableContext
										items={activeSection.fields.map((f) => f.id)}
										strategy={verticalListSortingStrategy}
									>
										<div className="space-y-2">
											{activeSection.fields.map((field) => (
												<SortableFieldRow
													key={field.id}
													field={field}
													isSelected={selectedFieldId === field.id}
													onSelect={() => setSelectedFieldId(field.id)}
													onDelete={() => deleteField(field.id)}
												/>
											))}
										</div>
									</SortableContext>
								</DndContext>
							)}
						</CardContent>
					</Card>
				</div>

				{/* ── Right: Field editor ───────────────────────────────────────── */}
				<div className="overflow-y-auto">
					{selectedField ? (
						<Card>
							<CardHeader className="pb-2 pt-4 px-4">
								<CardTitle className="text-sm">Edit field</CardTitle>
							</CardHeader>
							<CardContent className="px-4 pb-4 space-y-4">
								{/* Label */}
								<div className="space-y-1.5">
									<Label htmlFor="field-label" className="text-xs">
										Label
									</Label>
									<Input
										id="field-label"
										value={selectedField.label}
										onChange={(e) =>
											updateField(selectedField.id, { label: e.target.value })
										}
									/>
								</div>

								{/* Type (read-only badge) */}
								<div className="space-y-1.5">
									<Label className="text-xs">Type</Label>
									<div>
										<Badge variant="secondary" className="capitalize">
											{selectedField.type}
										</Badge>
									</div>
								</div>

								{/* Required toggle */}
								<div className="flex items-center justify-between">
									<Label htmlFor="field-required" className="text-xs">
										Required
									</Label>
									<Switch
										id="field-required"
										checked={selectedField.required}
										onCheckedChange={(v) =>
											updateField(selectedField.id, { required: v })
										}
									/>
								</div>

								{/* Dropdown options */}
								{selectedField.type === "dropdown" && (
									<div className="space-y-1.5">
										<Label className="text-xs">Options</Label>
										<div className="space-y-1">
											{/* biome-ignore lint/suspicious/noArrayIndexKey: option indices may duplicate string values */}
											{(selectedField.options ?? []).map((opt, i) => (
												<div key={`opt-${i}`} className="flex gap-1">
													<Input
														value={opt}
														onChange={(e) => {
															const opts = [...(selectedField.options ?? [])];
															opts[i] = e.target.value;
															updateField(selectedField.id, { options: opts });
														}}
														className="text-sm h-7"
													/>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="h-7 px-2"
														onClick={() => {
															const opts = (selectedField.options ?? []).filter(
																(_, idx) => idx !== i,
															);
															updateField(selectedField.id, { options: opts });
														}}
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											))}
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="w-full text-xs"
												onClick={() => {
													const opts = [
														...(selectedField.options ?? []),
														`Option ${(selectedField.options?.length ?? 0) + 1}`,
													];
													updateField(selectedField.id, { options: opts });
												}}
											>
												<Plus className="h-3 w-3 mr-1" />
												Add option
											</Button>
										</div>
									</div>
								)}

								{/* Condition */}
								<div className="space-y-1.5">
									<Label htmlFor="field-condition" className="text-xs">
										Show condition{" "}
										<span className="text-muted-foreground">(optional)</span>
									</Label>
									<Input
										id="field-condition"
										value={selectedField.condition ?? ""}
										onChange={(e) =>
											updateField(selectedField.id, {
												condition: e.target.value || undefined,
											})
										}
										placeholder='e.g. tenure == "owned"'
										className="text-xs font-mono"
									/>
								</div>
							</CardContent>
						</Card>
					) : (
						<div className="flex flex-col items-center justify-center h-48 text-center text-sm text-muted-foreground border-2 border-dashed rounded-xl">
							<ChevronRight className="h-6 w-6 mb-2 opacity-40" />
							Select a field to edit its properties
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
