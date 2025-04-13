import { Box, Divider, Flex } from "~/styled-system/jsx";
import { Input } from "./Input";
import { Label } from "./Label";
import { Select } from "./Select";
import { Textarea } from "./Textarea";
import type { GetUserOwnedTrackBySlug } from "~/utils/getUserOwnedTrackBySlug.server";
import { Button } from "./Button";

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
        <Label>Image</Label>
        <Input name="image" defaultValue={track?.image} />
      </Box>

      <Box>
        <Label>URL</Label>
        <Input name="url" defaultValue={track?.url} />
      </Box>

      <Divider borderColor="gray.800" />

      <Box>
        <Label>Address</Label>
        <Input name="address" defaultValue={track?.address ?? ""} />
      </Box>

      <Box>
        <Label>Postcode</Label>
        <Input name="postcode" defaultValue={track?.postcode ?? ""} />
      </Box>

      <Box>
        <Label>City</Label>
        <Input name="city" defaultValue={track?.city ?? ""} />
      </Box>

      <Box>
        <Label>Country</Label>
        <Input name="country" defaultValue={track?.country ?? ""} />
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
