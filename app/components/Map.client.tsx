import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { styled, Box } from "~/styled-system/jsx";
import { useParams } from "@remix-run/react";
import { getTabParam } from "~/utils/getTabParam";
import { LinkButton } from "./Button";
import L from "leaflet";
import { TrackTypes, Tracks } from "@prisma/client";

export type Values<T> = T[keyof T];

interface Props {
  tracks: Tracks[];
}

export const Map = ({ tracks }: Props) => {
  const params = useParams();
  const tab = getTabParam(params.tab);

  return (
    <Box h="100%" position="relative" overflow="hidden" zIndex={1}>
      <Box h="100%" overflow="hidden">
        <MapContainer
          center={[54.5, -2]}
          style={{ height: "100%" }}
          zoom={6}
          zoomControl
          doubleClickZoom
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {tracks
            .filter((item) => {
              if (tab === TrackTypes.ALL) {
                return true;
              }

              return item.types.includes(tab);
            })
            .map((item) => {
              const icon = L.icon({
                iconUrl: item.image,
                iconSize: [50, 50],
                className: "marker",
              });

              return (
                <Marker
                  key={item.name}
                  position={[item.lat, item.lng]}
                  icon={icon}
                >
                  <Popup closeButton>
                    <Box minWidth={280} p={4}>
                      {item.image && (
                        <Box mb={2} overflow="hidden" rounded="md">
                          <styled.img src={item.image} />
                        </Box>
                      )}
                      <styled.h1 fontSize="md" fontWeight="bold" mb={2}>
                        {item.name}
                      </styled.h1>
                      {item.description && (
                        <styled.p
                          mt="0 !important"
                          mb={2}
                          whiteSpace="pre-line"
                        >
                          {item.description}
                        </styled.p>
                      )}

                      <LinkButton to={item.url} target="_blank" w="full" mb={2}>
                        {item.url.includes("facebook")
                          ? "Visit Facebook"
                          : "Visit Website"}
                      </LinkButton>

                      <LinkButton
                        to={`/calendar/${item.slug}`}
                        w="full"
                        variant="secondary"
                      >
                        View Events
                      </LinkButton>
                    </Box>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </Box>
    </Box>
  );
};
