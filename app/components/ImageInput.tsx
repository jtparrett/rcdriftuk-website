import { Box, Center, Flex, styled } from "~/styled-system/jsx";
import { Input } from "./Input";
import { RiCameraFill } from "react-icons/ri";

interface Props {
  name: string;
  onChange: (file: File) => void;
  value: File | string | null;
}

export const ImageInput = ({ name, onChange, value }: Props) => {
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onChange?.(file);
    }
  };

  const imageUrl = value instanceof File ? URL.createObjectURL(value) : value;

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
      {imageUrl && (
        <styled.img
          src={imageUrl}
          alt="Uploaded"
          w="full"
          h="full"
          objectFit="cover"
        />
      )}
      {!imageUrl && (
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
