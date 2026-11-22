import type { Metadata } from "next";
import { generateToolMetadata } from "@/constants/tool-seo";

export const metadata: Metadata = generateToolMetadata("pan-card-crop");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
