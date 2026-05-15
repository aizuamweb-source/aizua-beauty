import { redirect } from "next/navigation";

const ACADEMY_URL = "https://aiacademy.aizualabs.com";

export default function AcademyPage() {
  redirect(ACADEMY_URL);
}
