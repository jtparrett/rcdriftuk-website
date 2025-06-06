import { addressLookup, type AddressLookup } from "~/utils/addressLookup";
import { Input } from "./Input";
import { useEffect, useState } from "react";
import { Box, styled } from "~/styled-system/jsx";
import { Dropdown, Option } from "./Dropdown";

interface Props {
  address: string;
  lat: number;
  lng: number;
  onChange?: (address: string, lat: number, lng: number) => void;
}

export const AddressInput = ({ address, lat, lng, onChange }: Props) => {
  const [options, setOptions] = useState<AddressLookup[]>([]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (address && focused) {
        const lookup = await addressLookup(address);
        setOptions(lookup);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [address, focused]);

  return (
    <Box pos="relative">
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />

      <Input
        name="address"
        value={address}
        placeholder="Type an address to search..."
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setTimeout(() => {
            const active = document.activeElement;
            const listbox = document.querySelector('[role="listbox"]');
            if (!listbox?.contains(active)) {
              setFocused(false);
            }
          }, 0);
        }}
        onChange={(e) => {
          onChange?.(e.target.value, lat, lng);
        }}
      />

      {address.length > 0 && focused && (
        <Dropdown role="listbox">
          {options.length > 0 && (
            <Box>
              {options.map((option) => (
                <Option
                  key={option.display_name}
                  onClick={() => {
                    onChange?.(
                      option.display_name,
                      parseFloat(option.lat),
                      parseFloat(option.lon),
                    );
                    setFocused(false);
                  }}
                  type="button"
                >
                  {option.display_name}
                </Option>
              ))}
            </Box>
          )}

          {options.length <= 0 && (
            <styled.p px={2} py={1} fontSize="sm">
              No results found, try a different search
            </styled.p>
          )}

          <Option
            type="button"
            onClick={() => {
              setFocused(false);
            }}
          >
            Use "{address}"
          </Option>
        </Dropdown>
      )}
    </Box>
  );
};
