import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Tracks } from "@prisma/client";

export type Values<T> = T[keyof T];

interface Props {
  track: Tracks;
}

export const MiniMap = ({ track }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken =
      "pk.eyJ1IjoicmNkcmlmdHVrIiwiYSI6ImNtOXRoemVnaDBjMTYyaXNhaTJmMGJzdDgifQ.sIkAsgKgczVp8rhphOGAcA";

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [track.lng, track.lat],
      zoom: 12,
      interactive: false,
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [track.lat, track.lng]);

  return <div ref={mapContainer} style={{ height: "100%" }} />;
};
