import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings | Clinic Appointment Booker",
  description: "Configure your clinic staff and hours.",
};

export default function SettingsPage() {
  return (
    <main className="min-h-screen pb-20">
      <SettingsClient />
    </main>
  );
}
