import { permanentRedirect } from "next/navigation";

export default function EnquiriesRedirect() {
  permanentRedirect("/sales/leads");
}
