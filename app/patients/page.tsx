import PatientsClient from "./PatientsClient";

export const metadata = {
  title: "Patients | Clinic Appointment Booker",
  description: "Manage patient records and information.",
};

export default function PatientsPage() {
  return <PatientsClient />;
}
