"use client";

import {
	BarChart3,
	DownloadIcon,
	FileText,
	LayoutDashboard,
	LogOut,
	MapPin,
	MegaphoneIcon,
	Settings,
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
	{ title: "Export", href: "/dashboard/export", icon: DownloadIcon },
	{ title: "Import", href: "/dashboard/import", icon: UploadIcon },
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
		<Sidebar className="border-r border-border/60 bg-sidebar/95 backdrop-blur-md">
			<SidebarHeader className="p-4 pb-3">
				<div className="flex items-center gap-3">
					<div className="relative size-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-border bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
						<Image
							src="/vevhu-icon.png"
							alt="Vevhu Resources"
							width={40}
							height={40}
							className="object-cover size-full"
						/>
					</div>
					<div className="flex flex-col min-w-0">
						<p className="text-sm font-extrabold tracking-tight text-sidebar-foreground truncate">
							VEVHU RESOURCES
						</p>
						<div className="flex items-center gap-1.5 mt-0.5">
							<Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-primary/10 text-primary border-primary/20 capitalize">
								{role || "Admin"}
							</Badge>
							<span className="text-[10px] text-muted-foreground truncate">Field System</span>
						</div>
					</div>
				</div>
			</SidebarHeader>

			<SidebarSeparator className="opacity-60" />

			<SidebarContent className="px-2.5 py-2">
				<SidebarGroup>
					<SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2 mb-1">
						Management
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className="space-y-0.5">
							{navMain.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										isActive={pathname === item.href}
										render={
											<Link href={item.href} onClick={handleNavClick} className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg text-sm font-medium transition-all hover:bg-accent/80">
												<item.icon className="size-4 shrink-0 transition-transform group-hover:scale-110" />
												<span>{item.title}</span>
											</Link>
										}
									/>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup className="mt-2">
					<SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2 mb-1">
						Tools & Operations
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className="space-y-0.5">
							{navTools.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										isActive={pathname === item.href}
										render={
											<Link href={item.href} onClick={handleNavClick} className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg text-sm font-medium transition-all hover:bg-accent/80">
												<item.icon className="size-4 shrink-0 transition-transform group-hover:scale-110" />
												<span>{item.title}</span>
											</Link>
										}
									/>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarSeparator className="opacity-60" />

			<SidebarFooter className="p-2.5">
				<SidebarMenu className="space-y-0.5">
					<SidebarMenuItem>
						<SidebarMenuButton
							isActive={pathname === "/dashboard/settings"}
							render={
								<Link href="/dashboard/settings" onClick={handleNavClick} className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg text-sm font-medium transition-all hover:bg-accent/80">
									<Settings className="size-4 shrink-0" />
									<span>Settings</span>
								</Link>
							}
						/>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton onClick={handleSignOut} className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-all">
							<LogOut className="size-4 shrink-0" />
							<span>Sign out</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
