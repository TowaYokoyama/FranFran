"use client";

import { Canvas } from "@react-three/fiber";
import { Loader } from "@react-three/drei";
import { AvatarModel } from "./Avatar/AvatarModel";

import { Suit } from "./Avatar/Suit";
import { Background } from "./Avatar/BackGround";

type Props = {
  isTalking: boolean;
};

export const AvatarCanvas = ({ isTalking }: Props) => {
  return (
    <>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        {/* --- 環境設定 --- */}
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 5, 2]} intensity={2} />

        {/* --- 各パーツ（コンポーネント）の配置 --- */}
        <Background />
        <Suit />
        <AvatarModel isTalking={isTalking} />
      </Canvas>
      <Loader />
    </>
  );
};