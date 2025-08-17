// app/components/AvatarCanvas.tsx

"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, Image } from "@react-three/drei";

const AVATAR_PATH = "/mymodel.glb";
const BACKGROUND_PATH = "/background.png";
const SUIT_PATH= "lalala.jpg"
const Model = () => {
  const { scene } = useGLTF(AVATAR_PATH);
  
  // ★★★ ここの position と scale の数値を調整します！ ★★★
  return (
    <primitive
      object={scene}
      position={[-1.5, 0.6, 1]}   // 左右、上下、前後
      scale={0.6}             // 全体の大きさ
    />
  );
};

const SceneBackground = () => {
  return <Image
    url={BACKGROUND_PATH}
    position={[0, 0.5, -3]} // 背景の位置を少し上に調整
    scale={8}             // 背景の大きさを少し調整
  />;
};

const SuitImage = () => {
    return <Image 
    url={SUIT_PATH}
    position={[0,-0.8 , 0]} // X(左右), Y(上下), Z(前後)
    scale={[1.54,0.6]}//横、縦 
    />;
}

export const AvatarCanvas = () => {
  return (
    <Canvas
      // ★ カメラをさらに後ろに下げて、全体が見えるようにします
      camera={{ position: [0, 0, 5], fov: 50 }}
    >
      <SceneBackground />
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 5, 2]} intensity={2} />
      
      {/* ★★★ デバッグ用の補助線を追加 ★★★ *
      <axesHelper args={[5]} /> * X(赤), Y(緑), Z(青)のを表示 
      <gridHelper />            地面グリッド */}

      <Model />
      <SuitImage />
    </Canvas>
  );
};

useGLTF.preload(AVATAR_PATH);