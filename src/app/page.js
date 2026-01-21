import { redirect } from "next/navigation";

export default function Home() {
  // The root page is not meant for public access.
  // Redirect to the admin area; middleware will enforce login.
  redirect("/admin");
}
