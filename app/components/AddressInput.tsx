import { addressLookup, type AddressLookup } from "~/utils/addressLookup";
import { Input } from "./Input";
import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Box, styled } from "~/styled-system/jsx";
import { Button } from "./Button";

interface Props {
  address?: string;
  lat?: number;
  lng?: number;
}

const formSchema = z.object({
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
});

const validationSchema = toFormikValidationSchema(formSchema);

const Option = styled(Button, {
  base: {
    px: 2,
    py: 1,
    bgColor: "transparent",
    borderWidth: 0,
    w: "full",
    justifyContent: "flex-start",
    rounded: "none",
    textAlign: "left",
  },
});

export const AddressInput = ({ address, lat, lng }: Props) => {
  const [options, setOptions] = useState<AddressLookup[]>([]);

  const formik = useFormik({
    validationSchema,
    initialValues: {
      address: address ?? "",
      lat: lat ?? 0,
      lng: lng ?? 0,
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
    <Box pos="relative">
      <input type="hidden" name="lat" value={formik.values.lat} />
      <input type="hidden" name="lng" value={formik.values.lng} />

      {!formik.isValid && (
        <styled.p color="red.500" fontSize="sm">
          Please select an address
        </styled.p>
      )}

      <Input
        name="address"
        value={formik.values.address}
        onFocus={() => {
          formik.setFieldTouched("address", true);
        }}
        onChange={(e) => {
          formik.setFieldValue("address", e.target.value);
        }}
      />

      {formik.touched.address && formik.values.address.length > 0 && (
        <Box
          pos="absolute"
          top="full"
          left={0}
          w="full"
          zIndex={1000}
          bgColor="gray.800"
          borderRadius="lg"
          borderWidth={1}
          borderColor="gray.700"
          mt={1}
          overflow="hidden"
        >
          {options.length > 0 && (
            <Box>
              {options.map((option) => (
                <Option
                  key={option.display_name}
                  onClick={() => {
                    formik.setFieldValue("address", option.display_name);
                    formik.setFieldValue("lat", parseFloat(option.lat));
                    formik.setFieldValue("lng", parseFloat(option.lon));
                    formik.setFieldTouched("address", false);
                  }}
                  type="button"
                >
                  {option.display_name}
                </Option>
              ))}
            </Box>
          )}

          {options.length <= 0 && !formik.isValid && (
            <styled.span
              color="red.500"
              px={2}
              py={1}
              fontSize="sm"
              display="block"
            >
              No results found, try a different address
            </styled.span>
          )}

          {formik.isValid && (
            <Option
              type="button"
              onClick={() => {
                formik.setFieldTouched("address", false);
              }}
            >
              Use "{formik.values.address}"
            </Option>
          )}
        </Box>
      )}
    </Box>
  );
};
