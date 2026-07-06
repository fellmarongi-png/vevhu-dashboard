"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
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
	const [loginStep, setLoginStep] = useState<string | null>(null);

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
		setLoginStep("Verifying credentials…");

		const supabase = createClient();
		const { error } = await supabase.auth.signInWithPassword({
			email: values.email,
			password: values.password,
		});

		if (error) {
			setServerError(error.message);
			setLoginStep(null);
		} else {
			setLoginStep("Access granted! Opening manager portal…");
			setTimeout(() => {
				router.push("/dashboard");
				router.refresh();
			}, 600);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-500/10 via-background to-orange-600/10 p-4">
			<Card className="w-full max-w-sm border-border/80 shadow-xl backdrop-blur-sm">
				<CardHeader className="space-y-2 items-center text-center pb-4">
					<div className="relative size-16 rounded-2xl overflow-hidden shadow-md ring-2 ring-primary/20 bg-white p-1">
						<Image
							src="/vevhu-icon.png"
							alt="Vevhu Resources"
							width={64}
							height={64}
							className="object-cover size-full rounded-xl"
							priority
						/>
					</div>
					<div className="space-y-1">
						<CardTitle className="text-2xl font-black tracking-tight text-foreground flex items-center justify-center gap-1.5">
							VEVHU RESOURCES
						</CardTitle>
						<CardDescription className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
							<ShieldCheck className="size-3.5 text-primary" /> Manager & Admin Field Portal
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{serverError && (
							<Alert variant="destructive" className="py-2 text-xs">
								<AlertDescription>{serverError}</AlertDescription>
							</Alert>
						)}
						<div className="space-y-1.5">
							<Label htmlFor="email" className="text-xs font-semibold">
								Admin Email
							</Label>
							<Input
								id="email"
								type="email"
								placeholder="manager@vevhu.com"
								autoComplete="email"
								disabled={isSubmitting}
								{...register("email")}
								className="h-10 text-sm"
							/>
							{errors.email && (
								<p className="text-xs text-destructive">
									{errors.email.message}
								</p>
							)}
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								autoComplete="current-password"
								disabled={isSubmitting}
								{...register("password")}
								className="h-10 text-sm"
							/>
							{errors.password && (
								<p className="text-xs text-destructive">
									{errors.password.message}
								</p>
							)}
						</div>

						{/* Animated Progress Feedback */}
						{isSubmitting && (
							<div className="space-y-1.5 py-1 text-center animate-fade-in">
								<div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
									<div className="h-full bg-primary animate-pulse w-full transition-all duration-500" />
								</div>
								<p className="text-xs text-primary font-medium flex items-center justify-center gap-1.5">
									<Sparkles className="size-3 animate-spin text-primary" />
									{loginStep || "Authenticating security token…"}
								</p>
							</div>
						)}

						<Button
							type="submit"
							className="w-full h-10 font-bold shadow-md transition-all active:scale-[0.98]"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<span className="flex items-center gap-2">
									<Loader2 className="size-4 animate-spin" />
									Signing in…
								</span>
							) : (
								"Sign in to Dashboard"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
