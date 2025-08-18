"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import * as THREE from "three";

const AVATAR_PATH = "/mymodel.glb";

type Props = {
  isTalking: boolean;
};

export const AvatarModel = ({ isTalking }: Props) => {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(AVATAR_PATH);

  // 毎フレームごとのアニメーション処理
  useFrame((state) => {
    if (!group.current) return;

    // --- 1. アイドリングモーション (常に実行) ---
    // ゆっくりとした周期で体を左右に揺らします。
    // これが待機中の自然な動きになります。

    //state.clock.elapsedTime は「アプリ開始からの経過秒数」。
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.05;

    // --- 2. 頷きモーション (isTalkingがtrueの時だけ実行) ---
    if (isTalking) {
      // アイドリングの動きに加えて、頷きの動きをX軸に適用します。
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 5) * 0.03;
    } else {
      // 話していない時は、頷きの角度をスムーズに0に戻します。
      group.current.rotation.x =
        Math.abs(group.current.rotation.x) < 0.01
          ? 0
          : group.current.rotation.x * 0.9;
    }
  });

  return (
    <group ref={group} position={[-1.5, 0.55, 1]} scale={0.6}>
      <primitive object={scene} />
    </group>
  );
};

useGLTF.preload(AVATAR_PATH);