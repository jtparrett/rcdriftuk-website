import { MapContainer, TileLayer } from "react-leaflet";
import type { Tracks } from "@prisma/client";

export type Values<T> = T[keyof T];

interface Props {
  track: Tracks;
}

export const MiniMap = ({ track }: Props) => {
  return (
    <MapContainer
      center={[track.lat, track.lng]}
      style={{ height: "100%" }}
      zoom={12}
      zoomControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    </MapContainer>
  );
};
