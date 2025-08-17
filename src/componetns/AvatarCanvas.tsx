// app/components/AvatarCanvas.tsx

"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, Image } from "@react-three/drei";

const AVATAR_PATH = "/mymodel.glb";
const BACKGROUND_PATH = "/background.png";

const Model = () => {
  const { scene } = useGLTF(AVATAR_PATH);
  
  // ★★★ ここの position と scale の数値を調整します！ ★★★
  return (
    <primitive
      object={scene}
      position={[-1, 0.5, 1.2]}   // 左右、上下、前後
      scale={0.4}             // 全体の大きさ
    />
  );
};

const SceneBackground = () => {
  return <Image
    url={BACKGROUND_PATH}
    position={[0, 0.5, -3]} // 背景の位置を少し上に調整
    scale={7}             // 背景の大きさを少し調整
  />;
};

export const AvatarCanvas = () => {
  return (
    <Canvas
      // ★ カメラをさらに後ろに下げて、全体が見えるようにします
      camera={{ position: [0, 0, 5], fov: 50 }}
    >
      <SceneBackground />
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 5, 2]} intensity={2} />
      
      {/* ★★★ デバッグ用の補助線を追加 ★★★ */}
      <axesHelper args={[5]} /> {/* X(赤), Y(緑), Z(青)の軸を表示 */}
      <gridHelper />            {/* 地面にグリッドを表示 */}

      <Model />
    </Canvas>
  );
};

useGLTF.preload(AVATAR_PATH);