// app/components/AvatarCanvas.tsx

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Image, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";

const AVATAR_PATH = "/mymodel.glb";
const BACKGROUND_PATH = "/background.png";
const SUIT_PATH= "lalala.jpg"


import * as THREE from "three";

const Model = (isTalking:any)=> {
  const group =  useRef<THREE.Group>(null);
  const { scene } = useGLTF(AVATAR_PATH);
  //const {actions} = useAnimations(animations, group);


  //useframeで画面をフレームごとにモデルを更新していく! 

  useFrame((state)=> {
    //group.currentが読み込まれていない場合は動かない
    if(!group.current) return;

    //isTalkingがtrueの場合
    if(isTalking){
      // state.clock.elapsedTime は経過時間です。
      // Math.sin() を使うことで、-1から1の間の滑らかな波を作ります。
      // これを頭の上下の回転（rotation.x）に適用することで、頷いているような動きを作ります。
      // 数値を調整することで、動きの速さや大きさを変更できます。
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 5) * 0.03;
    }else {
      // isTalkingがfalse（話していない状態）の場合...
      // 頭の回転をスムーズに元の位置(0)に戻します。
      group.current.rotation.x = Math.abs(group.current.rotation.x) < 0.01 
        ? 0 
        : group.current.rotation.x * 0.9;
    }
  })



  // ★★★ ここの position と scale の数値を調整します！ ★★★
  return (
    <group ref={group} position={[-1.5, 0.55, 1]}   // 左右、上下、前後
      scale={0.6}      
      >    // 全体の大きさ
    <primitive
      object={scene}
    />
    </group>   
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
    position={[-0,-0.8 , 0]} // X(左右), Y(上下), Z(前後)
    scale={[1.54,0.6]}//横、縦 
    />;
}



export const AvatarCanvas = ({isTalking}:any) => {
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

      <Model isTalking={isTalking} />
      <SuitImage />
    </Canvas>
  );
};


//最初にアバターモデルを読み込んでおくことで、表示の高速化
useGLTF.preload(AVATAR_PATH);