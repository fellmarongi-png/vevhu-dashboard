import { Skeleton } from "@/components/ui/skeleton";

export default function SubmissionsLoading() {
	return (
		<div className="space-y-4">
			<div>
				<Skeleton className="h-8 w-36" />
				<Skeleton className="h-4 w-64 mt-2" />
			</div>

			{/* Table skeleton */}
			<div className="rounded-xl border ring-1 ring-foreground/10 overflow-hidden">
				{/* Table header */}
				<div className="border-b bg-muted/50 px-4 py-3 flex gap-4">
					{["col1", "col2", "col3", "col4", "col5"].map((colKey) => (
						<Skeleton key={colKey} className="h-4 w-24" />
					))}
				</div>

				{/* Table rows */}
				<div className="divide-y">
					{["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"].map((rowKey) => (
						<div key={rowKey} className="px-4 py-3 flex items-center gap-4">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-28" />
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-5 w-16 rounded-full" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
