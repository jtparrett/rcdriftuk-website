import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { useParams } from "@remix-run/react";
import { getTabParam } from "~/utils/getTabParam";
import { LinkButton } from "./Button";
import L from "leaflet";
import type { Tracks } from "@prisma/client";
import { TrackTypes } from "@prisma/client";
import { RiFacebookFill, RiLink } from "react-icons/ri";
import { singular } from "pluralize";

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
                        <Box
                          w="140px"
                          h="140px"
                          mb={2}
                          rounded="full"
                          overflow="hidden"
                          borderWidth={2}
                          borderColor="gray.500"
                        >
                          <styled.img
                            src={item.image}
                            w="full"
                            h="full"
                            objectFit="cover"
                          />
                        </Box>
                      )}
                      <styled.h1 fontSize="md" fontWeight="bold" mb={2}>
                        {item.name}
                      </styled.h1>
                      {item.description && (
                        <styled.p
                          mt="0 !important"
                          mb={2}
                          whiteSpace="pre-line !important"
                          lineClamp={4}
                          truncate="ellipsis"
                          w="full"
                          overflow="hidden"
                        >
                          {item.description}
                        </styled.p>
                      )}

                      <Flex gap={1}>
                        <LinkButton
                          to={`/tracks/${item.slug}`}
                          flex={1}
                          textTransform="capitalize"
                        >
                          {singular(item.types[0] ?? "").toLowerCase()} Info
                        </LinkButton>

                        <LinkButton
                          to={item.url}
                          variant="secondary"
                          target="_blank"
                          size="sm"
                        >
                          {item.url.includes("facebook") ? (
                            <RiFacebookFill />
                          ) : (
                            <RiLink />
                          )}
                        </LinkButton>
                      </Flex>
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
