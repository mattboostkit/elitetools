import { permanentRedirect } from "next/navigation";

export default function FormErrorsRedirect() {
  permanentRedirect("/admin/form-errors");
}
