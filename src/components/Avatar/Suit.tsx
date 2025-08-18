import { Image } from "@react-three/drei";

const SUIT_PATH = "/lalala.jpg";

export const Suit = () => {
  return (
    <Image
      url={SUIT_PATH}
      position={[0, -0.8, 0]}
      scale={[1.54, 0.6]}
    />
  );
};