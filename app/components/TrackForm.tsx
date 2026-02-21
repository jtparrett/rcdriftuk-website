import { Box, Center, Divider, Flex, styled } from "~/styled-system/jsx";
import { Input } from "./Input";
import { Label } from "./Label";
import { Textarea } from "./Textarea";
import type { GetUserOwnedTrackBySlug } from "~/utils/getUserOwnedTrackBySlug.server";
import { Button } from "./Button";
import { AddressInput } from "./AddressInput";
import { ImageInput } from "./ImageInput";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { RiCloseCircleFill, RiMapPin2Fill } from "react-icons/ri";
import z from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useFormik } from "formik";
import { FormControl } from "./FormControl";
import { useFetcher } from "react-router";
import { resizeImage } from "~/utils/resizeImage";
import type { Leaderboards } from "@prisma/client";
import { Select } from "./Select";
import { Regions } from "~/utils/enums";
import { TabButton, TabGroup } from "./Tab";
import { useUserSearch, type SearchUser } from "~/hooks/useUserSearch";
import { Dropdown, Option } from "./Dropdown";

interface OwnerEntry {
  userId: string;
  driverId: number;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
}

interface Props {
  track?: GetUserOwnedTrackBySlug;
  leaderboards?: Leaderboards[];
  currentUserId?: string;
  defaultOwners?: OwnerEntry[];
}

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  url: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  image: z.union([z.instanceof(File), z.string()]),
  cover: z.union([z.instanceof(File), z.string()]).optional(),
  leaderboardId: z.string().optional(),
  region: z.nativeEnum(Regions),
  owners: z.array(
    z.object({
      userId: z.string(),
      driverId: z.number(),
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
      image: z.string().nullable(),
    }),
  ),
});

const validationSchema = toFormikValidationSchema(formSchema);

export const TrackForm = ({
  track,
  leaderboards,
  currentUserId,
  defaultOwners,
}: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const fetcher = useFetcher();
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerSearchFocused, setOwnerSearchFocused] = useState(false);

  const initialOwners: OwnerEntry[] =
    track?.Owners?.map((o) => ({
      userId: o.userId,
      driverId: o.user.driverId,
      firstName: o.user.firstName,
      lastName: o.user.lastName,
      image: o.user.image,
    })) ??
    defaultOwners ??
    [];

  const formik = useFormik<z.infer<typeof formSchema>>({
    validationSchema,
    initialValues: {
      name: track?.name ?? "",
      description: track?.description ?? "",
      url: track?.url ?? "",
      address: track?.address ?? "",
      lat: track?.lat ?? 0,
      lng: track?.lng ?? 0,
      image: track?.image ?? "",
      cover: track?.cover ?? "",
      leaderboardId: track?.leaderboardId ?? "",
      region: track?.region ?? Regions.UK,
      owners: initialOwners,
    },
    onSubmit: async (values) => {
      const formData = new FormData();

      if (values.image instanceof File) {
        const result = await resizeImage(values.image);
        formData.append("image", result);
      } else {
        formData.append("image", values.image);
      }

      if (values.cover instanceof File) {
        const result = await resizeImage(values.cover);
        formData.append("cover", result);
      } else if (values.cover) {
        formData.append("cover", values.cover);
      }

      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("url", values.url);
      formData.append("address", values.address);
      formData.append("lat", values.lat.toString());
      formData.append("lng", values.lng.toString());
      formData.append("leaderboardId", values.leaderboardId ?? "");
      formData.append("region", values.region);

      for (const owner of values.owners) {
        formData.append("ownerUserIds", owner.userId);
      }

      await fetcher.submit(formData, {
        method: "POST",
        encType: "multipart/form-data",
      });
    },
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken =
      "pk.eyJ1IjoicmNkcmlmdHVrIiwiYSI6ImNtOXRuenU3bjAxMDEyc3NldWxuMGp0YmEifQ.krploudyX3_F8kmpsaFePw";

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [track?.lng ?? -1, track?.lat ?? 52.3555],
      zoom: 10,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    const onMoveEnd = () => {
      const center = map.current?.getCenter();
      if (center) {
        formik.setFieldValue("lng", center.lng);
        formik.setFieldValue("lat", center.lat);
      }
    };

    map.current.on("moveend", onMoveEnd);

    // Cleanup
    return () => {
      map.current?.off("moveend", onMoveEnd);
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    map.current?.setCenter([formik.values.lng, formik.values.lat]);
  }, [formik.values]);

  const { data: ownerSearchResults = [], isLoading: isSearchingOwners } =
    useUserSearch(ownerSearch);

  const existingOwnerIds = new Set(formik.values.owners.map((o) => o.userId));
  const filteredOwnerResults = ownerSearchResults.filter(
    (u) => u.id && !existingOwnerIds.has(u.id),
  );

  const handleAddOwner = (user: SearchUser) => {
    if (!user.id) return;
    formik.setFieldValue("owners", [
      ...formik.values.owners,
      {
        userId: user.id,
        driverId: user.driverId,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
      },
    ]);
    setOwnerSearch("");
  };

  const handleRemoveOwner = (userId: string) => {
    formik.setFieldValue(
      "owners",
      formik.values.owners.filter((o) => o.userId !== userId),
    );
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      <Flex flexDir="column" gap={4}>
        <FormControl error={formik.errors.image}>
          <Label>Track Avatar</Label>
          <ImageInput
            name="image"
            value={formik.values.image}
            onChange={(file) => formik.setFieldValue("image", file)}
          />
        </FormControl>

        <FormControl error={formik.errors.cover}>
          <Label>Track Cover Photo</Label>
          <ImageInput
            name="cover"
            value={formik.values.cover ?? null}
            onChange={(file) => formik.setFieldValue("cover", file)}
          />
        </FormControl>

        <FormControl error={formik.errors.name}>
          <Label>Track Name</Label>
          <Input
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
          />
        </FormControl>

        <FormControl error={formik.errors.description}>
          <Label>Description</Label>
          <Textarea
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
          />
        </FormControl>

        <FormControl error={formik.errors.url}>
          <Label>Website/Primary Social URL</Label>
          <Input
            name="url"
            placeholder="e.g https://www.example.com"
            value={formik.values.url}
            onChange={formik.handleChange}
          />
        </FormControl>

        {(leaderboards?.length ?? 0) > 0 && (
          <>
            <Divider borderColor="gray.800" />
            <FormControl error={formik.errors.leaderboardId}>
              <Label>Leaderboard</Label>
              <Select
                name="leaderboardId"
                value={formik.values.leaderboardId}
                onChange={formik.handleChange}
              >
                <option value="">Select an option...</option>
                {leaderboards?.map((leaderboard) => (
                  <option key={leaderboard.id} value={leaderboard.id}>
                    {leaderboard.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </>
        )}

        <Divider borderColor="gray.800" />

        <FormControl error={formik.errors.region}>
          <Label>Region</Label>
          <TabGroup p={0}>
            {Object.values(Regions).map((item) => {
              if (item === Regions.ALL) {
                return null;
              }

              return (
                <TabButton
                  type="button"
                  key={item}
                  isActive={formik.values.region === item}
                  onClick={() => formik.setFieldValue("region", item)}
                >
                  {item}
                </TabButton>
              );
            })}
          </TabGroup>
        </FormControl>

        <Divider borderColor="gray.800" />

        <Box>
          <Label>Track Owners</Label>
          <Flex flexDir="column" gap={2}>
            {formik.values.owners.map((owner) => {
              const name =
                `${owner.firstName ?? ""} ${owner.lastName ?? ""}`.trim() ||
                `Driver #${owner.driverId}`;

              return (
                <Flex
                  key={owner.userId}
                  alignItems="center"
                  gap={3}
                  py={2}
                  px={3}
                  bgColor="gray.800"
                  rounded="xl"
                >
                  <styled.img
                    src={owner.image ?? "/blank-driver-right.jpg"}
                    alt={name}
                    w={8}
                    h={8}
                    rounded="full"
                    objectFit="cover"
                  />
                  <styled.span flex={1} fontSize="sm" fontWeight="medium">
                    {name}
                  </styled.span>
                  {owner.userId !== currentUserId && (
                    <Button
                      type="button"
                      variant="secondary"
                      px={1}
                      size="xs"
                      onClick={() => handleRemoveOwner(owner.userId)}
                    >
                      <RiCloseCircleFill />
                    </Button>
                  )}
                </Flex>
              );
            })}
          </Flex>

          <Box pos="relative" mt={3}>
            <Input
              placeholder="Search by name to add an owner..."
              value={ownerSearch}
              onChange={(e) => setOwnerSearch(e.target.value)}
              onFocus={() => setOwnerSearchFocused(true)}
              onBlur={() => {
                setTimeout(() => {
                  const active = document.activeElement;
                  const listbox = document.querySelector('[role="listbox"]');
                  if (!listbox?.contains(active)) {
                    setOwnerSearchFocused(false);
                  }
                }, 300);
              }}
            />
            {ownerSearchFocused && ownerSearch.length > 0 && (
              <Dropdown role="listbox">
                {isSearchingOwners && (
                  <Box px={3} py={2} color="gray.500" fontSize="sm">
                    Searching...
                  </Box>
                )}
                {!isSearchingOwners && filteredOwnerResults.length === 0 && (
                  <Box px={3} py={2} color="gray.500" fontSize="sm">
                    No users found
                  </Box>
                )}
                {filteredOwnerResults.map((user) => (
                  <Option
                    key={user.driverId}
                    type="button"
                    onClick={() => handleAddOwner(user)}
                  >
                    <Flex alignItems="center" gap={2}>
                      <styled.img
                        src={user.image ?? "/blank-driver-right.jpg"}
                        alt={user.firstName ?? ""}
                        w={6}
                        h={6}
                        rounded="full"
                        objectFit="cover"
                      />
                      <styled.span>
                        {user.firstName} {user.lastName}
                      </styled.span>
                    </Flex>
                  </Option>
                ))}
              </Dropdown>
            )}
          </Box>
        </Box>

        <Divider borderColor="gray.800" />

        <FormControl error={formik.errors.address}>
          <Label>Address</Label>
          <AddressInput
            address={formik.values.address}
            lat={formik.values.lat}
            lng={formik.values.lng}
            onChange={(address, lat, lng) => {
              formik.setFieldValue("address", address);
              formik.setFieldValue("lat", lat);
              formik.setFieldValue("lng", lng);
            }}
          />
        </FormControl>

        <Box pos="relative" overflow="hidden" rounded="2xl">
          <Box h={300} ref={mapContainer} />
          <Center
            pointerEvents="none"
            inset={0}
            pos="absolute"
            color="brand.500"
          >
            <RiMapPin2Fill size={32} />
          </Center>
        </Box>

        <Divider borderColor="gray.800" />

        <Button
          type="submit"
          isLoading={formik.isSubmitting}
          disabled={formik.isSubmitting}
        >
          {track ? "Save Changes" : "Register Track"}
        </Button>
      </Flex>
    </form>
  );
};
