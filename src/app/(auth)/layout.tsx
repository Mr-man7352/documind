import { TopNavbar } from "@/components/public-navbar/top-navbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>
    <TopNavbar />

    {children}
  </>;
}
