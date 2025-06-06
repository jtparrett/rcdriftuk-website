import { Box, Center, Flex, styled } from "~/styled-system/jsx";
import { Input } from "./Input";
import { RiUpload2Line } from "react-icons/ri";

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
      w={16}
      h={16}
      overflow="hidden"
      rounded="2xl"
      pos="relative"
      bgColor="gray.800"
      borderWidth={1}
      borderColor="gray.800"
    >
      <Input
        pos="absolute"
        inset={0}
        opacity={0}
        name={name}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        zIndex={2}
        cursor="pointer"
      />
      {imageUrl && (
        <styled.img
          src={imageUrl}
          alt="Uploaded"
          w="full"
          h="full"
          objectFit="cover"
          opacity={0.7}
        />
      )}
      <Center pos="absolute" inset={0} pointerEvents="none" zIndex={2}>
        <RiUpload2Line size={24} />
      </Center>
    </Box>
  );
};
