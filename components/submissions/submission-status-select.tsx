"use client";

import * as React from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["pending", "synced", "complete", "flagged", "disputed"] as const;
type Status = (typeof STATUSES)[number];

interface SubmissionStatusSelectProps {
	id: string;
	currentStatus: string;
}

export function SubmissionStatusSelect({
	id,
	currentStatus,
}: SubmissionStatusSelectProps) {
	const [status, setStatus] = React.useState<Status>(
		(STATUSES.includes(currentStatus as Status)
			? currentStatus
			: "pending") as Status,
	);
	const [saving, setSaving] = React.useState(false);

	async function handleChange(value: Status | null) {
		if (!value) return;
		setStatus(value);
		setSaving(true);
		const supabase = createClient();
		await supabase.from("submissions").update({ status: value }).eq("id", id);
		setSaving(false);
	}

	return (
		<Select value={status} onValueChange={handleChange} disabled={saving}>
			<SelectTrigger className="w-36">
				<SelectValue placeholder="Change status" />
			</SelectTrigger>
			<SelectContent>
				{STATUSES.map((s) => (
					<SelectItem key={s} value={s}>
						{s.charAt(0).toUpperCase() + s.slice(1)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
