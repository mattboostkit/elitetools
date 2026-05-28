import { permanentRedirect } from "next/navigation";

export default function QuotesRedirect() {
  permanentRedirect("/sales/quotes");
}
