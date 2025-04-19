import { Box, Center, Flex, styled } from "~/styled-system/jsx";
import { Input } from "./Input";
import { useState } from "react";
import { RiCameraFill } from "react-icons/ri";

interface Props {
  name: string;
}

export const ImageInput = ({ name }: Props) => {
  const [image, setImage] = useState<File | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      setImage(file);
    }
  };

  return (
    <Box
      w="86px"
      h="86px"
      overflow="hidden"
      rounded="full"
      pos="relative"
      bgColor="black"
    >
      <Input
        pos="absolute"
        inset={0}
        opacity={0}
        name={name}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        zIndex={1}
        cursor="pointer"
      />
      {image && (
        <styled.img
          src={URL.createObjectURL(image)}
          alt="Uploaded"
          w="full"
          h="full"
          objectFit="cover"
        />
      )}
      {!image && (
        <Center h="full" w="full">
          <Box>
            <Flex justifyContent="center" fontSize="xl">
              <RiCameraFill />
            </Flex>
            <styled.span fontSize="sm" fontWeight="medium">
              Upload
            </styled.span>
          </Box>
        </Center>
      )}
    </Box>
  );
};
