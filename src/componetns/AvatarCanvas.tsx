// (1) "use client" は、このコンポーネントがブラウザ側で動作することを示すNext.jsのおまじないです。
"use client";

// (2) 必要なライブラリやコンポーネントをインポート（読み込み）します。
import { Canvas } from "@react-three/fiber"; // 3Dシーンを描画する土台となる<Canvas>コンポーネント
import { useGLTF, OrbitControls, Image } from "@react-three/drei"; // 便利な3D関連ツール群

// (3) 3Dモデルのファイルがどこにあるかを指定する変数です。publicフォルダからのパスになります。
const AVATAR_PATH = "/mymodel.glb";

// (4) 背景画像のファイルがどこにあるかを指定する変数です。
const BACKGROUND_PATH = "/background.png";

// (5) 3Dモデル（アバター）を表示するためのコンポーネントを定義します。
const Model = () => {
  // (6) useGLTFフックを使って、指定したパスの3Dモデルを読み込みます。
  const { scene } = useGLTF(AVATAR_PATH);
  // (7) 読み込んだ3Dモデルのデータ（scene）を、<primitive>という要素で画面に表示します。
  return <primitive object={scene} />;
  // (8) Modelコンポーネントの終わりです。
};

// (9) 背景画像を表示するためのコンポーネントを定義します。
const SceneBackground = () => {
  // (10) @react-three/dreiの<Image>コンポーネントを使って、画像を表示する平面を作成します。
  return <Image
    // (11) urlプロパティに、表示したい画像のパスを指定します。
    url={BACKGROUND_PATH}
    // (12) positionプロパティで、3D空間内での位置を調整します。[x, y, z]の順です。zをマイナスにすることで奥に配置します。
    position={[0, 0, -3]}
    // (13) scaleプロパティで、画像の大きさを調整します。
    scale={6}
  />;
  // (14) SceneBackgroundコンポーネントの終わりです。
};


// (15) アバターと背景をまとめて表示する、メインのコンポーネントを定義します。
export const AvatarCanvas = () => {
  // (16) returnの中身が、実際に画面に描画される要素になります。
  return (
    // (17) <Canvas>コンポーネントで3D空間の土台を作ります。
    <Canvas
      // (18) cameraプロパティで、3D空間を写すカメラの位置や角度などを設定します。
      camera={{ position: [0, 0, 2.5], fov: 50 }}
    >
      {/* (19) ここから下は、3D空間の中に配置する要素です */}

      {/* (20) 背景コンポーネントを呼び出して、空間の奥に背景を表示します。 */}
      <SceneBackground />

      {/* (21) 環境光を追加します。シーン全体を均一に照らす、影のない光です。 */}
      <ambientLight
        // (22) intensityプロパティで、光の強さを設定します。
        intensity={1.5}
      />

      {/* (23) 平行光（太陽光のような光）を追加します。影を作ることができます。 */}
      <directionalLight
        // (24) positionプロパティで、光が差してくる方向を決めます。
        position={[3, 5, 2]}
        // (25) intensityプロパティで、光の強さを設定します。
        intensity={2}
      />

      {/* (26) アバターモデルのコンポーネントを呼び出して、空間内にアバターを表示します。 */}
      <Model />
      {/* (28) ここまでが3D空間の中に配置する要素です */}
    </Canvas> // (29) <Canvas>コンポーネントの終わりです。
  ); // (30) returnの終わりです。
}; // (31) AvatarCanvasコンポーネントの終わりです。

// (32) 事前にモデルを読み込んでおくことで、表示を高速化するためのおまじないです。
useGLTF.preload(AVATAR_PATH);
// (33) ファイルの終わりです。