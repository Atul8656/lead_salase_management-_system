import CRMLayout from "@/components/CRMLayout";

export default function CrmSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CRMLayout>{children}</CRMLayout>;
}
