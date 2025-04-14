import { Box, Divider, Flex, styled } from "~/styled-system/jsx";
import { Input } from "./Input";
import { Label } from "./Label";
import { Select } from "./Select";
import { Textarea } from "./Textarea";
import type { GetUserOwnedTrackBySlug } from "~/utils/getUserOwnedTrackBySlug.server";
import { Button } from "./Button";
import { AddressInput } from "./AddressInput";
interface Props {
  track?: GetUserOwnedTrackBySlug;
}

export const TrackForm = ({ track }: Props) => {
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
        <Label>Track Photo</Label>
        <Input name="image" type="file" accept="image/*" />
      </Box>

      <Box>
        <Label>URL</Label>
        <Input name="url" defaultValue={track?.url} />
      </Box>

      <Divider borderColor="gray.800" />

      <Box>
        <Label>Address</Label>
        <AddressInput
          address={track?.address ?? undefined}
          lat={track?.lat}
          lng={track?.lng}
        />
      </Box>

      <Divider borderColor="gray.800" />

      <Box>
        <Label>Categories</Label>
      </Box>

      <Divider borderColor="gray.800" />

      <Button type="submit">{track ? "Save Changes" : "Register Track"}</Button>
    </Flex>
  );
};
