import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Box } from "~/styled-system/jsx";
import { useNavigate, useParams } from "react-router";
import { getTabParam } from "~/utils/getTabParam";
import type { Tracks } from "@prisma/client";
import { TrackTypes } from "~/utils/enums";

export type Values<T> = T[keyof T];

interface Props {
  tracks: Tracks[];
}

export const Map = ({ tracks }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const params = useParams();
  const tab = getTabParam(params.tab);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken =
      "pk.eyJ1IjoicmNkcmlmdHVrIiwiYSI6ImNtOXRuenU3bjAxMDEyc3NldWxuMGp0YmEifQ.krploudyX3_F8kmpsaFePw";

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-1, 52.3555],
      zoom: 6,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Filter tracks based on tab
    const filteredTracks = tracks.filter((item) => {
      if (tab === TrackTypes.ALL) {
        return true;
      }
      return item.types.includes(tab);
    });

    // Add markers for each track
    filteredTracks.forEach((track) => {
      // Create marker element
      const el = document.createElement("div");
      el.className = "marker";

      const img = document.createElement("img");
      img.src = track.image;

      el.appendChild(img);

      // Create and add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([track.lng, track.lat])
        .addTo(map.current!);

      // Add click handler
      el.addEventListener("click", () => {
        navigate(`/tracks/${track.slug}`);
      });

      markers.current.push(marker);
    });

    // Extra markers
    [
      {
        lat: 35.107552,
        lng: 144.032135,
        image: "/zerofeel-source.png",
        href: "https://zerofeel.co.uk",
      },
    ].forEach((data) => {
      // Create marker element
      const el = document.createElement("div");
      el.className = "marker marker--large";

      const img = document.createElement("img");
      img.src = data.image;
      el.appendChild(img);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([data.lng, data.lat])
        .addTo(map.current!);

      el.addEventListener("click", () => {
        window.open(data.href, "_blank");
      });

      markers.current.push(marker);
    });
  }, [tracks, tab, navigate]);

  return (
    <Box h="100%" position="relative" overflow="hidden" zIndex={1}>
      <Box ref={mapContainer} h="100%" overflow="hidden" />
    </Box>
  );
};
