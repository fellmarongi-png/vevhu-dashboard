import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmissionStatusSelect } from "@/components/submissions/submission-status-select";
import { MapPinIcon, MicIcon, ImageIcon, PenToolIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  complete: "default",
  flagged: "destructive",
  disputed: "outline",
};

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: submission, error } = await supabase
    .from("submissions")
    .select("*, users!worker_id(full_name)")
    .eq("id", id)
    .single();

  if (error || !submission) {
    notFound();
  }

  const photos: string[] = submission.photos ?? [];
  const audioUrl: string | null = submission.audio_recording_key ?? null;
  const signatureUrl: string | null = submission.signature_key ?? null;
  const gpsLat: number | null = submission.gps_latitude ?? null;
  const gpsLng: number | null = submission.gps_longitude ?? null;

  // Collect form fields (exclude known top-level fields)
  const excludeKeys = new Set([
    "id", "worker_id", "stand_number_official", "stand_number_physical", "respondent_name", "respondent_type",
    "status", "collected_at", "photos", "audio_recording_key", "audio_duration_seconds",
    "signature_key", "gps_latitude", "gps_longitude", "gps_accuracy", "created_at", "updated_at", "synced_at", "users",
  ]);
  const formFields = Object.entries(submission).filter(
    ([key]) => !excludeKeys.has(key)
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Submission Detail</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-mono truncate">{id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_COLORS[submission.status ?? "pending"] ?? "secondary"}>
            {submission.status ?? "pending"}
          </Badge>
          <SubmissionStatusSelect id={id} currentStatus={submission.status ?? "pending"} />
        </div>
      </div>

      {/* Core info */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-sm sm:text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Worker</p>
            <p className="font-medium">{submission.users?.full_name ?? submission.worker_id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Stand #</p>
            <p className="font-medium">{submission.stand_number_official ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Respondent</p>
            <p className="font-medium">{submission.respondent_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Form Type</p>
            <p className="font-medium">{submission.form_type ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Zone</p>
            <p className="font-medium">{submission.zone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Collected At</p>
            <p className="font-medium">
              {submission.collected_at
                ? format(new Date(submission.collected_at), "dd MMM yyyy HH:mm")
                : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic form fields */}
      {formFields.length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base">Form Data</CardTitle>
            <CardDescription className="text-xs sm:text-sm">All recorded field responses</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
            {formFields.map(([key, value]) => (
              <div key={key}>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="font-medium break-words">
                  {value == null ? "—" : String(value)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Photo gallery */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-4" /> Photos ({photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square overflow-hidden rounded-lg border ring-1 ring-foreground/10 hover:opacity-90 transition-opacity"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audio */}
      {audioUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MicIcon className="size-4" /> Audio Recording
            </CardTitle>
          </CardHeader>
          <CardContent>
            <audio controls className="w-full" src={audioUrl}>
              Your browser does not support the audio element.
            </audio>
          </CardContent>
        </Card>
      )}

      {/* Signature */}
      {signatureUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenToolIcon className="size-4" /> Signature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-white p-2 ring-1 ring-foreground/10 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signatureUrl}
                alt="Signature"
                className="max-h-40 object-contain"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* GPS mini-map */}
      {gpsLat !== null && gpsLng !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinIcon className="size-4" /> Location
            </CardTitle>
            <CardDescription>
              {gpsLat.toFixed(6)}, {gpsLng.toFixed(6)}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-xl">
            <iframe
              title="GPS location"
              width="100%"
              height="240"
              style={{ border: 0 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${gpsLng - 0.005}%2C${gpsLat - 0.005}%2C${gpsLng + 0.005}%2C${gpsLat + 0.005}&layer=mapnik&marker=${gpsLat}%2C${gpsLng}`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
