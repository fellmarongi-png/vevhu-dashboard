"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const router = useRouter();
	const [serverError, setServerError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	async function onSubmit(values: LoginFormValues) {
		setServerError(null);

		const supabase = createClient();
		const { error } = await supabase.auth.signInWithPassword({
			email: values.email,
			password: values.password,
		});

		if (error) {
			setServerError(error.message);
		} else {
			router.push("/dashboard");
			router.refresh();
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-1 items-center text-center">
					<Image
						src="/vevhu-icon.png"
						alt="Vevhu Resources"
						width={56}
						height={56}
						className="mb-2 mx-auto rounded-xl"
					/>
					<CardTitle className="text-2xl font-bold">Vevhu Resources</CardTitle>
					<CardDescription>Sign in to the manager dashboard</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{serverError && (
							<Alert variant="destructive">
								<AlertDescription>{serverError}</AlertDescription>
							</Alert>
						)}
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="manager@example.com"
								autoComplete="email"
								{...register("email")}
							/>
							{errors.email && (
								<p className="text-xs text-destructive">
									{errors.email.message}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								autoComplete="current-password"
								{...register("password")}
							/>
							{errors.password && (
								<p className="text-xs text-destructive">
									{errors.password.message}
								</p>
							)}
						</div>
						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? "Signing in..." : "Sign in"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
