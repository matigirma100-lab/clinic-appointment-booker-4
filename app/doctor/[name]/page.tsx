import { PageContainer } from "@/components/PageContainer";
import { DoctorScheduleClient } from "@/app/doctor/[name]/DoctorScheduleClient";

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const doctor = decodeURIComponent(name);

  return (
    <PageContainer>
      <DoctorScheduleClient doctor={doctor} />
    </PageContainer>
  );
}

