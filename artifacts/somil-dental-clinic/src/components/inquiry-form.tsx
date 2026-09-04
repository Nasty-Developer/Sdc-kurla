import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";

const baseApiPath = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

export default function InquiryForm() {
  const [values, setValues] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const update = (field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (status === "error") setStatus("idle");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch(`${baseApiPath}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "We could not send your message.");
      setValues({ name: "", email: "", phone: "", message: "" });
      setStatus("sent");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We could not send your message.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="inquiry-success" role="status">
        <CheckCircle2 size={24} />
        <strong>Message received.</strong>
        <span>Thank you — the clinic team will get back to you shortly.</span>
        <button type="button" onClick={() => setStatus("idle")}>Send another message</button>
      </div>
    );
  }

  return (
    <form className="inquiry-form" onSubmit={submit}>
      <div className="inquiry-form-heading">
        <div className="eyebrow">Have a question?</div>
        <h3>Send us a message.</h3>
      </div>
      <label>Name<input required minLength={2} maxLength={80} value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="Your name" /></label>
      <div className="inquiry-contact-grid">
        <label>Email<input required type="email" maxLength={160} value={values.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" /></label>
        <label>Phone<input required type="tel" maxLength={30} value={values.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+91 85914 34914" /></label>
      </div>
      <label>Message<textarea required minLength={2} maxLength={1000} rows={3} value={values.message} onChange={(event) => update("message", event.target.value)} placeholder="How can we help?" /></label>
      {status === "error" ? <p className="inquiry-form-error" role="alert">{error}</p> : null}
      <button className="button-primary inquiry-submit" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Sending…" : <>Send message <Send size={15} /></>}</button>
    </form>
  );
}