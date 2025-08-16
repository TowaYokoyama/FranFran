// components/AvatarCanvas.tsx
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import { Mesh } from "three";

// アニメーションするボックスコンポーネント
const AnimatedBox = () => {
  const meshRef = useRef<Mesh>(null!);
  
  // 毎フレーム呼ばれる処理
  useFrame((state, delta) => {
    // ゆっくり上下に動かす
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.15;
    meshRef.current.rotation.y += delta * 0.2;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color={"#60a5fa"} />
    </mesh>
  );
};

// 3Dシーン全体を描画するキャンバス
export const AvatarCanvas = () => {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={1} />
      <AnimatedBox />
      {/* <OrbitControls /> */} {/* 開発時にカメラを動かしたい場合はコメントを外す */}
    </Canvas>
  );
};