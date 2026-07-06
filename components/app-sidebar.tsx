"use client";

import {
	BarChart3,
	ChevronRight,
	DownloadIcon,
	FileText,
	LayoutDashboard,
	LogOut,
	MapPin,
	MegaphoneIcon,
	Settings,
	ShieldCheck,
	UploadIcon,
	Users,
	WrenchIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
	useSidebar,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";

const navMain = [
	{ title: "Overview", href: "/dashboard", icon: LayoutDashboard },
	{ title: "Submissions", href: "/dashboard/submissions", icon: FileText },
	{ title: "Field Workers", href: "/dashboard/workers", icon: Users },
	{ title: "Map View", href: "/dashboard/map", icon: MapPin },
	{ title: "Spitzkop Lot 6 Plan", href: "/dashboard/site-plan", icon: MapPin },
	{ title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

const navTools = [
	{ title: "Form Builder", href: "/dashboard/form-builder", icon: WrenchIcon },
	{ title: "Export Data", href: "/dashboard/export", icon: DownloadIcon },
	{ title: "Import Data", href: "/dashboard/import", icon: UploadIcon },
	{
		title: "Announcements",
		href: "/dashboard/announcements",
		icon: MegaphoneIcon,
	},
];

export function AppSidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const { isMobile, setOpenMobile } = useSidebar();
	const [role, setRole] = useState<string | null>(null);

	const handleNavClick = useCallback(() => {
		if (isMobile) {
			setOpenMobile(false);
		}
	}, [isMobile, setOpenMobile]);

	useEffect(() => {
		async function fetchRole() {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				const { data } = await supabase
					.from("users")
					.select("role")
					.eq("id", user.id)
					.single();
				setRole(data?.role ?? null);
			}
		}
		fetchRole();
	}, []);

	async function handleSignOut() {
		if (isMobile) setOpenMobile(false);
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/login");
		router.refresh();
	}

	return (
		<Sidebar className="border-r border-border/80 bg-sidebar/95 backdrop-blur-xl shadow-lg select-none">
			{/* Brand Header */}
			<SidebarHeader className="p-4 pb-3">
				<div className="flex items-center gap-3">
					<div className="relative size-11 rounded-2xl overflow-hidden shadow-md ring-2 ring-primary/20 bg-white p-0.5 shrink-0">
						<Image
							src="/vevhu-icon.png"
							alt="Vevhu Resources"
							width={44}
							height={44}
							className="object-cover size-full rounded-xl"
							priority
						/>
					</div>
					<div className="flex flex-col min-w-0">
						<h2 className="text-base font-black tracking-tight text-sidebar-foreground truncate leading-snug">
							VEVHU RESOURCES
						</h2>
						<div className="flex items-center gap-1.5 mt-0.5">
							<Badge
								variant="default"
								className="text-[11px] px-2 py-0.5 font-bold bg-primary text-primary-foreground shadow-xs capitalize"
							>
								<ShieldCheck className="size-3 mr-0.5 inline-block" />
								{role || "Admin"}
							</Badge>
							<span className="text-xs text-muted-foreground font-medium truncate">
								Field System
							</span>
						</div>
					</div>
				</div>
			</SidebarHeader>

			<SidebarSeparator className="my-1 opacity-60" />

			{/* Navigation Content */}
			<SidebarContent className="px-3 py-2 space-y-4">
				<SidebarGroup>
					<SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 px-3 py-1 mb-1.5 flex items-center justify-between">
						<span>Management</span>
						<span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
							Core
						</span>
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className="space-y-1">
							{navMain.map((item) => {
								const isActive = pathname === item.href;
								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											isActive={isActive}
											className="h-auto p-0 hover:bg-transparent"
											render={
												<Link
													href={item.href}
													onClick={handleNavClick}
													className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
														isActive
															? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold"
															: "text-sidebar-foreground/80 hover:bg-accent/80 hover:text-sidebar-foreground"
													}`}
												>
													<item.icon
														className={`size-5 shrink-0 transition-transform duration-200 ${
															isActive
																? "text-primary-foreground scale-110"
																: "text-muted-foreground group-hover:text-primary group-hover:scale-110"
														}`}
													/>
													<span className="flex-1 truncate">{item.title}</span>
													{isActive && (
														<span className="size-1.5 rounded-full bg-primary-foreground animate-pulse" />
													)}
												</Link>
											}
										/>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 px-3 py-1 mb-1.5 flex items-center justify-between">
						<span>Tools & Operations</span>
						<span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
							Admin
						</span>
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className="space-y-1">
							{navTools.map((item) => {
								const isActive = pathname === item.href;
								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											isActive={isActive}
											className="h-auto p-0 hover:bg-transparent"
											render={
												<Link
													href={item.href}
													onClick={handleNavClick}
													className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
														isActive
															? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold"
															: "text-sidebar-foreground/80 hover:bg-accent/80 hover:text-sidebar-foreground"
													}`}
												>
													<item.icon
														className={`size-5 shrink-0 transition-transform duration-200 ${
															isActive
																? "text-primary-foreground scale-110"
																: "text-muted-foreground group-hover:text-primary group-hover:scale-110"
														}`}
													/>
													<span className="flex-1 truncate">{item.title}</span>
													{isActive && (
														<span className="size-1.5 rounded-full bg-primary-foreground animate-pulse" />
													)}
												</Link>
											}
										/>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarSeparator className="my-1 opacity-60" />

			{/* Footer */}
			<SidebarFooter className="p-3">
				<SidebarMenu className="space-y-1">
					<SidebarMenuItem>
						<SidebarMenuButton
							isActive={pathname === "/dashboard/settings"}
							className="h-auto p-0 hover:bg-transparent"
							render={
								<Link
									href="/dashboard/settings"
									onClick={handleNavClick}
									className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
										pathname === "/dashboard/settings"
											? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold"
											: "text-sidebar-foreground/80 hover:bg-accent/80 hover:text-sidebar-foreground"
									}`}
								>
									<Settings
										className={`size-5 shrink-0 transition-transform duration-200 ${
											pathname === "/dashboard/settings"
												? "text-primary-foreground scale-110"
												: "text-muted-foreground group-hover:text-primary group-hover:scale-110"
										}`}
									/>
									<span className="flex-1 truncate">Settings</span>
									{pathname === "/dashboard/settings" && (
										<span className="size-1.5 rounded-full bg-primary-foreground animate-pulse" />
									)}
								</Link>
							}
						/>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<button
							type="button"
							onClick={handleSignOut}
							className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
						>
							<LogOut className="size-5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
							<span className="flex-1 text-left truncate">Sign out</span>
							<ChevronRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
						</button>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
