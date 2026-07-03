"use client";

import { Map, Marker, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";

interface Submission {
  id: string;
  stand_number: string;
  worker_id: string;
  worker_name: string;
  created_at: string;
  status: "complete" | "pending" | "flagged";
  latitude: number;
  longitude: number;
}

const STATUS_COLORS: Record<string, string> = {
  complete: "#22c55e",
  pending: "#f97316",
  flagged: "#ef4444",
};

export function SubmissionsMap({ submissions }: { submissions: Submission[] }) {
  const [selectedMarker, setSelectedMarker] = useState<Submission | null>(null);

  return (
    <Map
      initialViewState={{ longitude: 31.05, latitude: -17.83, zoom: 12 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      onClick={() => setSelectedMarker(null)}
    >
      {submissions.map((s) => (
        <Marker
          key={s.id}
          longitude={s.longitude}
          latitude={s.latitude}
          onClick={(e) => {
            (e.originalEvent as MouseEvent).stopPropagation();
            setSelectedMarker(s);
          }}
        >
          <div
            title={`Stand ${s.stand_number} — ${s.status}`}
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: STATUS_COLORS[s.status] ?? "#6366f1",
              border: "2px solid white",
              boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
              cursor: "pointer",
            }}
          />
        </Marker>
      ))}

      {selectedMarker && (
        <Popup
          longitude={selectedMarker.longitude}
          latitude={selectedMarker.latitude}
          anchor="bottom"
          offset={12}
          closeButton
          closeOnClick={false}
          onClose={() => setSelectedMarker(null)}
        >
          <Card className="border-0 shadow-none min-w-40">
            <CardContent className="p-3 space-y-1.5">
              <p className="font-semibold text-sm">
                Stand {selectedMarker.stand_number}
              </p>
              <p className="text-xs text-muted-foreground">
                Worker: {selectedMarker.worker_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(selectedMarker.created_at), "d MMM yyyy, HH:mm")}
              </p>
              <Badge
                variant={
                  selectedMarker.status === "complete"
                    ? "default"
                    : selectedMarker.status === "flagged"
                    ? "destructive"
                    : "secondary"
                }
                className="text-xs capitalize"
              >
                {selectedMarker.status}
              </Badge>
            </CardContent>
          </Card>
        </Popup>
      )}
    </Map>
  );
}
