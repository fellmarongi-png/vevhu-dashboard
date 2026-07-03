"use client";

import { AlertCircleIcon, CheckCircleIcon, UploadIcon } from "lucide-react";
import * as React from "react";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const OUR_FIELDS = [
	{ key: "stand_number", label: "Stand Number" },
	{ key: "zone", label: "Zone" },
	{ key: "area", label: "Area" },
	{ key: "registered_owner_name", label: "Registered Owner Name" },
	{ key: "registered_owner_id", label: "Registered Owner ID" },
	{ key: "account_status", label: "Account Status" },
] as const;

type OurFieldKey = (typeof OUR_FIELDS)[number]["key"];

type ParsedRow = Record<string, string>;

type ImportResult = {
	imported: number;
	skipped: number;
	errors: string[];
};

export default function ImportPage() {
	const [dragging, setDragging] = React.useState(false);
	const [fileName, setFileName] = React.useState<string | null>(null);
	const [detectedColumns, setDetectedColumns] = React.useState<string[]>([]);
	const [parsedRows, setParsedRows] = React.useState<ParsedRow[]>([]);
	const [columnMapping, setColumnMapping] = React.useState<
		Partial<Record<OurFieldKey, string>>
	>({});
	const [importing, setImporting] = React.useState(false);
	const [result, setResult] = React.useState<ImportResult | null>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	function parseFile(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => {
			const buffer = e.target?.result as ArrayBuffer;
			const wb = XLSX.read(buffer, { type: "array" });
			const ws = wb.Sheets[wb.SheetNames[0]];
			const data = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: "" });

			if (data.length === 0) return;

			const cols = Object.keys(data[0]);
			setDetectedColumns(cols);
			setParsedRows(data);
			setFileName(file.name);
			setResult(null);

			// Auto-map columns by fuzzy name match
			const autoMap: Partial<Record<OurFieldKey, string>> = {};
			OUR_FIELDS.forEach(({ key }) => {
				const match = cols.find(
					(c) =>
						c.toLowerCase().replace(/[^a-z0-9]/g, "_") === key.toLowerCase(),
				);
				if (match) autoMap[key] = match;
			});
			setColumnMapping(autoMap);
		};
		reader.readAsArrayBuffer(file);
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		setDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) parseFile(file);
	}

	function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) parseFile(file);
	}

	const previewRows = parsedRows.slice(0, 10);

	async function handleImport() {
		setImporting(true);
		setResult(null);
		try {
			const supabase = createClient();
			let imported = 0;
			let skipped = 0;
			const errors: string[] = [];

			const records = parsedRows.map((row) => {
				const record: Partial<Record<OurFieldKey, string>> & { id?: string } =
					{};
				OUR_FIELDS.forEach(({ key }) => {
					const srcCol = columnMapping[key];
					if (srcCol && row[srcCol] !== undefined) {
						record[key] = String(row[srcCol]);
					}
				});
				return record;
			});

			// Upsert in batches of 50
			const batchSize = 50;
			for (let i = 0; i < records.length; i += batchSize) {
				const batch = records.slice(i, i + batchSize);
				const validBatch = batch.filter((r) => r.stand_number);
				skipped += batch.length - validBatch.length;

				if (validBatch.length === 0) continue;

				const { error, data } = await supabase
					.from("known_stands")
					.upsert(validBatch, {
						onConflict: "stand_number",
						ignoreDuplicates: false,
					})
					.select();

				if (error) {
					errors.push(error.message);
				} else {
					imported += data?.length ?? validBatch.length;
				}
			}

			setResult({ imported, skipped, errors });
		} catch (err) {
			setResult({ imported: 0, skipped: 0, errors: [String(err)] });
		} finally {
			setImporting(false);
		}
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<div>
				<h1 className="text-xl sm:text-2xl font-bold tracking-tight">
					Import Stands
				</h1>
				<p className="text-xs sm:text-sm text-muted-foreground">
					Upload a CSV or Excel file to import known stands data.
				</p>
			</div>

			{/* Upload Zone */}
			<Card>
				<CardContent className="pt-6">
					<div
						className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center cursor-pointer transition-colors ${
							dragging
								? "border-primary bg-primary/5"
								: "border-border hover:border-primary/50"
						}`}
						onDragOver={(e) => {
							e.preventDefault();
							setDragging(true);
						}}
						onDragLeave={() => setDragging(false)}
						onDrop={handleDrop}
						onClick={() => fileInputRef.current?.click()}
					>
						<UploadIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
						{fileName ? (
							<p className="font-medium">{fileName}</p>
						) : (
							<>
								<p className="font-medium">
									Drop a file here or click to upload
								</p>
								<p className="text-sm text-muted-foreground mt-1">
									Supports .csv and .xlsx
								</p>
							</>
						)}
						<input
							ref={fileInputRef}
							type="file"
							accept=".csv,.xlsx,.xls"
							className="hidden"
							onChange={handleFileInput}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Column Mapping */}
			{detectedColumns.length > 0 && (
				<Card>
					<CardHeader className="p-3 sm:p-6">
						<CardTitle className="text-sm sm:text-base">
							Column Mapping
						</CardTitle>
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
						<p className="text-xs sm:text-sm text-muted-foreground mb-4">
							Detected {detectedColumns.length} columns in your file. Map them
							to our fields below.
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{OUR_FIELDS.map(({ key, label }) => (
								<div key={key} className="space-y-1.5">
									<Label>{label}</Label>
									<Select
										value={columnMapping[key] ?? ""}
										onValueChange={(v) =>
											setColumnMapping((prev) => ({
												...prev,
												[key]: v || undefined,
											}))
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Not mapped" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="">Not mapped</SelectItem>
											{detectedColumns.map((col) => (
												<SelectItem key={col} value={col}>
													{col}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Preview */}
			{previewRows.length > 0 && (
				<Card>
					<CardHeader className="p-3 sm:p-6">
						<CardTitle className="text-sm sm:text-base">
							Preview{" "}
							<span className="text-muted-foreground font-normal text-xs sm:text-base">
								(first {previewRows.length} of {parsedRows.length} rows)
							</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										{OUR_FIELDS.map(({ key, label }) => (
											<TableHead key={key}>
												{label}
												{!columnMapping[key] && (
													<span className="text-muted-foreground text-xs ml-1">
														(unmapped)
													</span>
												)}
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{previewRows.map((row, i) => (
										<TableRow key={i}>
											{OUR_FIELDS.map(({ key }) => {
												const srcCol = columnMapping[key];
												return (
													<TableCell key={key}>
														{srcCol ? (
															row[srcCol] || "—"
														) : (
															<span className="text-muted-foreground">—</span>
														)}
													</TableCell>
												);
											})}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						<div className="mt-4">
							<Button
								onClick={handleImport}
								disabled={importing || !columnMapping.stand_number}
								className="w-full sm:w-auto"
							>
								<UploadIcon className="w-4 h-4 mr-2" />
								{importing
									? "Importing..."
									: `Import ${parsedRows.length} Rows`}
							</Button>
							{!columnMapping.stand_number && (
								<p className="text-sm text-destructive mt-2">
									Stand Number must be mapped before importing.
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Result */}
			{result && (
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-start gap-3">
							{result.errors.length === 0 ? (
								<CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
							) : (
								<AlertCircleIcon className="w-5 h-5 text-destructive mt-0.5" />
							)}
							<div className="space-y-1">
								<p className="font-medium">Import Complete</p>
								<div className="flex gap-3 text-sm">
									<Badge variant="outline" className="text-green-600">
										{result.imported} imported
									</Badge>
									{result.skipped > 0 && (
										<Badge variant="outline" className="text-muted-foreground">
											{result.skipped} skipped (no stand number)
										</Badge>
									)}
								</div>
								{result.errors.length > 0 && (
									<div className="mt-2 space-y-1">
										{result.errors.map((e, i) => (
											<p key={i} className="text-sm text-destructive">
												{e}
											</p>
										))}
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
