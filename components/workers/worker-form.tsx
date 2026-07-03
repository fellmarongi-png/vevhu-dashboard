"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import bcrypt from "bcryptjs";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

// Define input schema using strings for all fields (react-hook-form always gives strings from inputs)
const workerSchema = z.object({
	full_name: z.string().min(1, "Name is required"),
	phone: z.string().min(7, "Phone number is required"),
	zone_assigned: z.string().min(1, "Zone is required"),
	daily_target: z
		.string()
		.min(1, "Target is required")
		.refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 1, {
			message: "Target must be at least 1",
		}),
	pin: z
		.string()
		.length(4, "PIN must be exactly 4 digits")
		.regex(/^\d{4}$/, "PIN must be 4 digits"),
});

type WorkerFormValues = z.infer<typeof workerSchema>;

export type WorkerDefaults = {
	id?: string;
	full_name?: string;
	phone?: string;
	zone_assigned?: string;
	daily_target?: number;
	pin?: string;
};

interface WorkerFormProps {
	defaultValues?: WorkerDefaults;
	onSuccess?: () => void;
}

export function WorkerForm({ defaultValues, onSuccess }: WorkerFormProps) {
	const isEdit = !!defaultValues?.id;

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<WorkerFormValues>({
		resolver: zodResolver(workerSchema),
		defaultValues: {
			full_name: defaultValues?.full_name ?? "",
			phone: defaultValues?.phone ?? "",
			zone_assigned: defaultValues?.zone_assigned ?? "",
			daily_target:
				defaultValues?.daily_target != null
					? String(defaultValues.daily_target)
					: "10",
			pin: defaultValues?.pin ?? "",
		},
	});

	const [serverError, setServerError] = React.useState<string | null>(null);

	async function onSubmit(values: z.output<typeof workerSchema>) {
		setServerError(null);
		const supabase = createClient();

		const payload = {
			full_name: values.full_name,
			phone: values.phone,
			zone_assigned: values.zone_assigned,
			daily_target: Number(values.daily_target),
			pin: values.pin,
			pin_hash: bcrypt.hashSync(values.pin, 10),
		};

		if (isEdit && defaultValues?.id) {
			const { error } = await supabase
				.from("users")
				.update(payload)
				.eq("id", defaultValues.id);
			if (error) {
				setServerError(error.message);
				return;
			}
		} else {
			const { error } = await supabase
				.from("users")
				.insert([{ ...payload, role: "worker", is_active: true }]);
			if (error) {
				setServerError(error.message);
				return;
			}
		}

		reset();
		onSuccess?.();
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div className="space-y-1">
				<Label htmlFor="full_name">Full Name</Label>
				<Input
					id="full_name"
					placeholder="Jane Doe"
					{...register("full_name")}
				/>
				{errors.full_name && (
					<p className="text-xs text-destructive">{errors.full_name.message}</p>
				)}
			</div>

			<div className="space-y-1">
				<Label htmlFor="phone">Phone</Label>
				<Input
					id="phone"
					type="tel"
					placeholder="+27 81 000 0000"
					{...register("phone")}
				/>
				{errors.phone && (
					<p className="text-xs text-destructive">{errors.phone.message}</p>
				)}
			</div>

			<div className="space-y-1">
				<Label htmlFor="zone_assigned">Zone</Label>
				<Input
					id="zone_assigned"
					placeholder="Zone A"
					{...register("zone_assigned")}
				/>
				{errors.zone_assigned && (
					<p className="text-xs text-destructive">
						{errors.zone_assigned.message}
					</p>
				)}
			</div>

			<div className="space-y-1">
				<Label htmlFor="daily_target">Daily Target</Label>
				<Input
					id="daily_target"
					type="number"
					min={1}
					placeholder="10"
					{...register("daily_target")}
				/>
				{errors.daily_target && (
					<p className="text-xs text-destructive">
						{errors.daily_target.message}
					</p>
				)}
			</div>

			<div className="space-y-1">
				<Label htmlFor="pin">PIN (4 digits)</Label>
				<Input
					id="pin"
					type="password"
					inputMode="numeric"
					maxLength={4}
					placeholder="••••"
					{...register("pin")}
				/>
				{errors.pin && (
					<p className="text-xs text-destructive">{errors.pin.message}</p>
				)}
			</div>

			{serverError && <p className="text-xs text-destructive">{serverError}</p>}

			<Button type="submit" className="w-full" disabled={isSubmitting}>
				{isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Add Worker"}
			</Button>
		</form>
	);
}
