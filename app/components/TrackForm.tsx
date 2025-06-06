import { Box, Center, Divider, Flex } from "~/styled-system/jsx";
import { Input } from "./Input";
import { Label } from "./Label";
import { Textarea } from "./Textarea";
import type { GetUserOwnedTrackBySlug } from "~/utils/getUserOwnedTrackBySlug.server";
import { Button } from "./Button";
import { AddressInput } from "./AddressInput";
import { ImageInput } from "./ImageInput";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { RiMapPin2Fill } from "react-icons/ri";
import z from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useFormik } from "formik";
import { FormControl } from "./FormControl";
import { useFetcher } from "react-router";
interface Props {
  track?: GetUserOwnedTrackBySlug;
}

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  url: z.string().url().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  image: z.union([z.instanceof(File), z.string()]),
  cover: z.union([z.instanceof(File), z.string()]).optional(),
});

const validationSchema = toFormikValidationSchema(formSchema);

export const TrackForm = ({ track }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const fetcher = useFetcher();

  const formik = useFormik({
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
    },
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("url", values.url);
      formData.append("address", values.address);
      formData.append("lat", values.lat.toString());
      formData.append("lng", values.lng.toString());
      formData.append("image", values.image);
      formData.append("cover", values.cover);

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
            value={formik.values.cover}
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
