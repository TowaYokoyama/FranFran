import type { Metadata } from "next";
import StartShell from "./StartShell";

export const metadata: Metadata = {
  title: "Start / Sign in",
  description: "ログインして面接を開始",
};

export default function Page() {
  return <StartShell />;
}
