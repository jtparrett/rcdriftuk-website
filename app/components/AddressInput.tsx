import { addressLookup, type AddressLookup } from "~/utils/addressLookup";
import { Input } from "./Input";
import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Box, styled } from "~/styled-system/jsx";
import { Dropdown, Option } from "./Dropdown";

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

export const AddressInput = ({ address, lat, lng }: Props) => {
  const [options, setOptions] = useState<AddressLookup[]>([]);
  const [focused, setFocused] = useState(false);

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
        placeholder="Type an address to search..."
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setTimeout(() => {
            const active = document.activeElement;
            const listbox = document.querySelector('[role="listbox"]');
            if (!listbox?.contains(active)) {
              setFocused(false);
            }
          }, 0);
        }}
        onChange={(e) => {
          formik.setFieldValue("address", e.target.value);
        }}
      />

      {formik.values.address.length > 0 && focused && (
        <Dropdown role="listbox">
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
                    setFocused(false);
                  }}
                  type="button"
                >
                  {option.display_name}
                </Option>
              ))}
            </Box>
          )}

          {options.length <= 0 && !formik.isValid && (
            <styled.p px={2} py={1} fontSize="sm">
              No results found, try a different search
            </styled.p>
          )}

          {formik.isValid && (
            <Option
              type="button"
              onClick={() => {
                formik.setFieldTouched("address", false);
                setFocused(false);
              }}
            >
              Use "{formik.values.address}"
            </Option>
          )}
        </Dropdown>
      )}
    </Box>
  );
};
