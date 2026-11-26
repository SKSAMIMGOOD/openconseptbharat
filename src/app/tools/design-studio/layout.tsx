import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design Studio — Free Online Card & Cover Designer | OpenConsept Bharat",
  description:
    "Design visiting cards, wedding invitations, school/college project covers, and ID cards with our client-side, private, interactive canvas studio. Export to high-res PNG, JPG, and vector print-ready PDF.",
};

export default function DesignStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
