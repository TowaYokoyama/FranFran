import { Image } from "@react-three/drei";

const BACKGROUND_PATH = "/background.png";

export const Background = () => {
  return (
    <Image
      url={BACKGROUND_PATH}
      position={[0, 0.5, -3]}
      scale={8}
      transparent
      opacity={0.9}
    />
  );
};
