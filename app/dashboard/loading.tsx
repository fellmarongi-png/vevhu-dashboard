import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-4 w-72 mt-2" />
			</div>

			{/* KPI cards skeleton */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-28" />
							<Skeleton className="h-4 w-4 rounded" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-7 w-16 mb-2" />
							<div className="flex items-center justify-between">
								<Skeleton className="h-3 w-36" />
								<Skeleton className="h-5 w-16 rounded-full" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Bottom section skeleton */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-32 mt-1" />
					</CardHeader>
					<CardContent className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<div
								key={i}
								className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
							>
								<div className="space-y-1">
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-3 w-44" />
								</div>
								<Skeleton className="h-5 w-16 rounded-full" />
							</div>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-40 mt-1" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-4 w-56" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
