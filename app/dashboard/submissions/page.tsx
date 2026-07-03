import { SubmissionsTable } from "@/components/submissions/submissions-table";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function SubmissionsPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
	const params = await searchParams;
	const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
	const pageSize =
		parseInt(params.pageSize ?? String(PAGE_SIZE), 10) || PAGE_SIZE;

	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;

	const supabase = await createServerSupabaseClient();

	// Get total count
	const { count } = await supabase
		.from("submissions")
		.select("*", { count: "exact", head: true });

	// Get paginated data
	const { data: submissions, error } = await supabase
		.from("submissions")
		.select("*, users!worker_id(full_name)")
		.order("collected_at", { ascending: false })
		.range(from, to);

	if (error) {
		console.error("Error fetching submissions:", error);
	}

	const totalCount = count ?? 0;
	const totalPages = Math.ceil(totalCount / pageSize);

	return (
		<div className="space-y-3 sm:space-y-4">
			<div>
				<h1 className="text-lg sm:text-2xl font-bold tracking-tight">
					Submissions
				</h1>
				<p className="text-xs sm:text-sm text-muted-foreground">
					View and manage all field data submissions.
				</p>
			</div>
			<SubmissionsTable
				initialData={submissions ?? []}
				currentPage={page}
				totalPages={totalPages}
				totalCount={totalCount}
				pageSize={pageSize}
			/>
		</div>
	);
}
