"use client";

import {
	AlertCircle,
	CheckCircle,
	Lock,
	Monitor,
	Moon,
	Sun,
	User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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

interface UserProfile {
	full_name: string | null;
	email: string;
	role: string | null;
}

export default function SettingsPage() {
	const { theme, setTheme } = useTheme();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);

	// Password form state
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordLoading, setPasswordLoading] = useState(false);
	const [passwordMessage, setPasswordMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	useEffect(() => {
		async function fetchProfile() {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user) {
				const { data } = await supabase
					.from("users")
					.select("full_name, role")
					.eq("id", user.id)
					.single();

				setProfile({
					full_name: data?.full_name ?? null,
					email: user.email ?? "",
					role: data?.role ?? null,
				});
			}
			setLoading(false);
		}

		fetchProfile();
	}, []);

	async function handlePasswordUpdate(e: React.FormEvent) {
		e.preventDefault();
		setPasswordMessage(null);

		if (newPassword !== confirmPassword) {
			setPasswordMessage({
				type: "error",
				text: "New passwords do not match.",
			});
			return;
		}

		if (newPassword.length < 6) {
			setPasswordMessage({
				type: "error",
				text: "Password must be at least 6 characters.",
			});
			return;
		}

		setPasswordLoading(true);
		const supabase = createClient();
		const { error } = await supabase.auth.updateUser({ password: newPassword });

		if (error) {
			setPasswordMessage({ type: "error", text: error.message });
		} else {
			setPasswordMessage({
				type: "success",
				text: "Password updated successfully.",
			});
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		}
		setPasswordLoading(false);
	}

	const themeOptions = [
		{ value: "light", label: "Light", icon: Sun },
		{ value: "dark", label: "Dark", icon: Moon },
		{ value: "system", label: "System", icon: Monitor },
	] as const;

	return (
		<div className="space-y-4 sm:space-y-6">
			<div>
				<h1 className="text-xl sm:text-2xl font-bold tracking-tight">
					Profile & Preferences
				</h1>
				<p className="text-xs sm:text-sm text-muted-foreground">
					Manage your account and dashboard settings
				</p>
			</div>

			<div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
				<div className="space-y-4 sm:space-y-6">
					{/* Profile Section */}
					<Card className="overflow-hidden">
						<CardHeader className="p-4 sm:p-6 bg-muted/30">
							<div className="flex items-center gap-3">
								<span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<User className="size-5" />
								</span>
								<div>
									<CardTitle className="text-sm sm:text-base">
										Profile
									</CardTitle>
									<CardDescription className="text-xs sm:text-sm">
										Your account information
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-4 sm:p-6">
							{loading ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<p className="text-[10px] uppercase tracking-wider text-muted-foreground">
											Full Name
										</p>
										<div className="h-5 w-32 bg-muted animate-pulse rounded" />
									</div>
									<div className="space-y-1.5">
										<p className="text-[10px] uppercase tracking-wider text-muted-foreground">
											Email
										</p>
										<div className="h-5 w-40 bg-muted animate-pulse rounded" />
									</div>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<p className="text-[10px] uppercase tracking-wider text-muted-foreground">
											Full Name
										</p>
										<p className="text-sm font-medium">
											{profile?.full_name || "Not set"}
										</p>
									</div>
									<div className="space-y-1.5">
										<p className="text-[10px] uppercase tracking-wider text-muted-foreground">
											Email
										</p>
										<p className="text-sm font-medium">{profile?.email}</p>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Appearance Section */}
					<Card className="overflow-hidden">
						<CardHeader className="p-4 sm:p-6 bg-muted/30">
							<div className="flex items-center gap-3">
								<span className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
									<Sun className="size-5" />
								</span>
								<div>
									<CardTitle className="text-sm sm:text-base">
										Appearance
									</CardTitle>
									<CardDescription className="text-xs sm:text-sm">
										Choose how the dashboard looks
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-wrap gap-2">
								{themeOptions.map(({ value, label, icon: Icon }) => (
									<Button
										key={value}
										variant={theme === value ? "default" : "outline"}
										size="sm"
										onClick={() => setTheme(value)}
										className="gap-2"
									>
										<Icon className="h-4 w-4" />
										{label}
									</Button>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				<div>
					{/* Password Section */}
					<Card className="overflow-hidden">
						<CardHeader className="p-4 sm:p-6 bg-muted/30">
							<div className="flex items-center gap-3">
								<span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
									<Lock className="size-5" />
								</span>
								<div>
									<CardTitle className="text-sm sm:text-base">
										Password
									</CardTitle>
									<CardDescription className="text-xs sm:text-sm">
										Update your account password
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-4 sm:p-6">
							<form onSubmit={handlePasswordUpdate} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="current-password">Current Password</Label>
									<Input
										id="current-password"
										type="password"
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										placeholder="Enter current password"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-password">New Password</Label>
									<Input
										id="new-password"
										type="password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										placeholder="Enter new password"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="confirm-password">Confirm New Password</Label>
									<Input
										id="confirm-password"
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="Confirm new password"
									/>
								</div>

								{passwordMessage && (
									<div
										className={`flex items-center gap-2 text-sm ${
											passwordMessage.type === "success"
												? "text-green-600 dark:text-green-400"
												: "text-destructive"
										}`}
									>
										{passwordMessage.type === "success" ? (
											<CheckCircle className="h-4 w-4" />
										) : (
											<AlertCircle className="h-4 w-4" />
										)}
										{passwordMessage.text}
									</div>
								)}

								<Button
									type="submit"
									disabled={passwordLoading || !newPassword || !confirmPassword}
								>
									{passwordLoading ? "Updating..." : "Update Password"}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
