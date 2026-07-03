import { AppSidebar } from "@/components/app-sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			{/* AppSidebar renders as a Sheet (drawer) on mobile via shadcn's useIsMobile hook */}
			<AppSidebar />
			<div className="flex flex-col flex-1 min-w-0 overflow-hidden">
				<DashboardTopbar />
				{/* Reduce padding on mobile to maximise usable screen real estate */}
				<main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 bg-background">
					{children}
				</main>
			</div>
		</SidebarProvider>
	);
}
