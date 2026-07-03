"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon } from "lucide-react";

type Submission = {
  id: string;
  worker_id: string;
  stand_number_official: string | null;
  respondent_name: string | null;
  respondent_type: string | null;
  status: string | null;
  collected_at: string | null;
  zone_assigned?: string | null;
  users?: { full_name: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "secondary",
  complete: "default",
  flagged: "destructive",
  disputed: "outline",
};

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "pending";
  const variant = (STATUS_COLORS[s] ?? "secondary") as
    | "default"
    | "secondary"
    | "destructive"
    | "outline";
  return <Badge variant={variant}>{s}</Badge>;
}

interface SubmissionsTableProps {
  initialData: Submission[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

export function SubmissionsTable({
  initialData,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: SubmissionsTableProps) {
  const router = useRouter();
  const [data, setData] = React.useState<Submission[]>(initialData);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [workerFilter, setWorkerFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [zoneFilter, setZoneFilter] = React.useState("all");

  // Realtime subscription
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("submissions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        (payload) => {
          setData((prev) => [payload.new as Submission, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "submissions" },
        (payload) => {
          setData((prev) =>
            prev.map((row) =>
              row.id === (payload.new as Submission).id
                ? (payload.new as Submission)
                : row
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: "users",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Worker
          <ArrowUpDownIcon className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => row.original.users?.full_name ?? row.original.worker_id,
      sortingFn: (a, b) => {
        const nameA = a.original.users?.full_name ?? "";
        const nameB = b.original.users?.full_name ?? "";
        return nameA.localeCompare(nameB);
      },
    },
    {
      accessorKey: "stand_number_official",
      header: "Stand #",
      cell: ({ getValue }) => getValue<string | null>() ?? "—",
    },
    {
      accessorKey: "respondent_name",
      // Hidden on mobile; visible from sm breakpoint
      header: () => <span className="hidden sm:inline">Respondent</span>,
      cell: ({ getValue }) => (
        <span className="hidden sm:inline">{getValue<string | null>() ?? "—"}</span>
      ),
    },
    {
      accessorKey: "respondent_type",
      header: "Type",
      cell: ({ getValue }) => getValue<string | null>() ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <StatusBadge status={getValue<string | null>()} />,
    },
    {
      accessorKey: "zone",
      // Hidden on mobile; visible from md breakpoint
      header: () => <span className="hidden md:inline">Zone</span>,
      cell: ({ getValue }) => (
        <span className="hidden md:inline">{getValue<string | null>() ?? "—"}</span>
      ),
    },
    {
      accessorKey: "collected_at",
      // Hidden on mobile; visible from md breakpoint
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:inline-flex"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDownIcon className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ getValue }) => {
        const val = getValue<string | null>();
        return (
          <span className="hidden md:inline">
            {val ? format(new Date(val), "dd MMM yyyy HH:mm") : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/submissions/${row.original.id}`);
          }}
        >
          <EyeIcon />
          <span className="sr-only">View</span>
        </Button>
      ),
    },
  ];

  const filteredData = React.useMemo(() => {
    return data.filter((row) => {
      const workerName = row.users?.full_name?.toLowerCase() ?? "";
      const matchesWorker =
        !workerFilter || workerName.includes(workerFilter.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;
      const matchesZone =
        zoneFilter === "all" || row.zone_assigned === zoneFilter;
      return matchesWorker && matchesStatus && matchesZone;
    });
  }, [data, workerFilter, statusFilter, zoneFilter]);

  const uniqueZones = React.useMemo(() => {
    const zones = new Set(data.map((r) => r.zone_assigned).filter(Boolean));
    return Array.from(zones) as string[];
  }, [data]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Filters — stack on mobile, row on sm+ */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Input
          placeholder="Filter by worker..."
          value={workerFilter}
          onChange={(e) => setWorkerFilter(e.target.value)}
          className="w-full sm:w-48"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => { if (v) setStatusFilter(v); }}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={zoneFilter}
          onValueChange={(v) => { if (v) setZoneFilter(v); }}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            {uniqueZones.map((zone) => (
              <SelectItem key={zone} value={zone}>
                {zone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table with horizontal scroll on mobile */}
      <div className="rounded-xl border ring-1 ring-foreground/10 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="text-xs sm:text-sm">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/submissions/${row.original.id}`)
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No submissions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] sm:text-xs text-muted-foreground">
          Showing {filteredData.length} of {totalCount} submissions
        </p>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => router.push(`/dashboard/submissions?page=${currentPage - 1}`)}
            className="text-xs sm:text-sm"
          >
            <ChevronLeftIcon className="size-3.5 sm:size-4 mr-0.5 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {currentPage}/{totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => router.push(`/dashboard/submissions?page=${currentPage + 1}`)}
            className="text-xs sm:text-sm"
          >
            Next
            <ChevronRightIcon className="size-3.5 sm:size-4 ml-0.5 sm:ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
