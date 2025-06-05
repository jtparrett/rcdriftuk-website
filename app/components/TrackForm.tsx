import { Box, Divider, Flex } from "~/styled-system/jsx";
import { Input } from "./Input";
import { Label } from "./Label";
import { Textarea } from "./Textarea";
import type { GetUserOwnedTrackBySlug } from "~/utils/getUserOwnedTrackBySlug.server";
import { Button } from "./Button";
import { AddressInput } from "./AddressInput";
import { ImageInput } from "./ImageInput";
import { useState } from "react";
interface Props {
  track?: GetUserOwnedTrackBySlug;
}

export const TrackForm = ({ track }: Props) => {
  const [image, setImage] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);

  return (
    <Flex flexDir="column" gap={4}>
      <Box>
        <Label>Track Avatar</Label>
        <ImageInput
          name="image"
          value={image}
          onChange={(file) => setImage(file)}
        />
      </Box>

      <Box>
        <Label>Track Cover Photo</Label>
        <ImageInput
          name="cover"
          value={cover}
          onChange={(file) => setCover(file)}
        />
      </Box>

      <Box>
        <Label>Track Name</Label>
        <Input name="name" defaultValue={track?.name} required />
      </Box>

      <Box>
        <Label>Description</Label>
        <Textarea
          name="description"
          defaultValue={track?.description ?? ""}
          required
        />
      </Box>

      <Box>
        <Label>Website/Primary Social URL</Label>
        <Input name="url" defaultValue={track?.url} required />
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

      <Button type="submit">{track ? "Save Changes" : "Register Track"}</Button>
    </Flex>
  );
};
