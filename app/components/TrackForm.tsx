import { Box, Divider, Flex, styled } from "~/styled-system/jsx";
import { Input } from "./Input";
import { Label } from "./Label";
import { Select } from "./Select";
import { Textarea } from "./Textarea";
import type { GetUserOwnedTrackBySlug } from "~/utils/getUserOwnedTrackBySlug.server";
import { Button } from "./Button";
import { useEffect, useState } from "react";
import { addressLookup, type AddressLookup } from "~/utils/addressLookup";
import { useFormik } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
interface Props {
  track?: GetUserOwnedTrackBySlug;
}

const formSchema = z.object({
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
});

const validationSchema = toFormikValidationSchema(formSchema);

export const TrackForm = ({ track }: Props) => {
  const [options, setOptions] = useState<AddressLookup[]>([]);

  const formik = useFormik({
    validationSchema,
    initialValues: {
      address: track?.address ?? "",
      lat: track?.lat ?? 0,
      lng: track?.lng ?? 0,
    },
    onSubmit() {},
  });

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (formik.values.address && formik.dirty) {
        const lookup = await addressLookup(formik.values.address);
        setOptions(lookup);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formik.values.address, formik.dirty]);

  return (
    <Flex flexDir="column" gap={4}>
      <Box>
        <Label>Name</Label>
        <Input name="name" defaultValue={track?.name} />
      </Box>

      <Box>
        <Label>Description</Label>
        <Textarea name="description" defaultValue={track?.description ?? ""} />
      </Box>

      <Box>
        <Label>Image</Label>
        <Input name="image" type="file" />
      </Box>

      <Box>
        <Label>URL</Label>
        <Input name="url" defaultValue={track?.url} />
      </Box>

      <Divider borderColor="gray.800" />

      <Box>
        <Label>Address</Label>
        {!formik.isValid && (
          <styled.p color="red.500" fontSize="sm">
            Please select an address
          </styled.p>
        )}

        <input type="hidden" name="lat" value={formik.values.lat} />
        <input type="hidden" name="lng" value={formik.values.lng} />

        <Input
          name="address"
          placeholder="Search for an address"
          value={formik.values.address}
          onChange={(e) => formik.setFieldValue("address", e.target.value)}
        />

        {formik.dirty && (
          <Box
            p={2}
            bgColor="gray.900"
            borderWidth={1}
            borderColor="gray.800"
            borderRadius="lg"
            mt={2}
          >
            {options.length > 0 && (
              <Select
                onChange={(e) => {
                  const option = options[parseInt(e.target.value)];
                  formik.setFieldValue("address", option.display_name);
                  formik.setFieldValue("lat", parseFloat(option.lat));
                  formik.setFieldValue("lng", parseFloat(option.lon));
                }}
              >
                <option value="">Select an address</option>
                {options.map((option, i) => (
                  <option key={option.display_name} value={i}>
                    {option.display_name}
                  </option>
                ))}
              </Select>
            )}

            {options.length <= 0 && (
              <styled.p color="red.500" fontSize="sm">
                No results found
              </styled.p>
            )}
          </Box>
        )}
      </Box>

      <Divider borderColor="gray.800" />

      <Box>
        <Label>Categories</Label>
        <Select name="types" defaultValue={track?.types} />
      </Box>

      <Divider borderColor="gray.800" />

      <Button type="submit">{track ? "Save Changes" : "Register Track"}</Button>
    </Flex>
  );
};
