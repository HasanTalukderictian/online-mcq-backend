import { useState } from "react";
import { apiRequest } from "../adminpanel/api";
import "../css/pages.css";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "", website: "" };
const MAX = 3000;

function ContactScreen({ site, onBack }) {
    const [form, setForm] = useState(EMPTY);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [fieldErr, setFieldErr] = useState({});
    const [done, setDone] = useState("");

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
    const firstError = (key) => (fieldErr[key] && fieldErr[key][0] ? fieldErr[key][0] : "");

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setFieldErr({});

        const name = form.name.trim();
        const email = form.email.trim();
        const message = form.message.trim();

        if (!name) return setError("Please enter your name.");
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
        if (message.length < 10) return setError("Please write a message of at least 10 characters.");

        setSending(true);
        try {
            const body = await apiRequest("/public/contact", {
                method: "POST",
                body: {
                    name: name,
                    email: email,
                    phone: form.phone.trim() || null,
                    subject: form.subject.trim() || null,
                    message: message,
                    website: form.website, // hidden honeypot
                },
            });
            setDone((body && body.message) || "Thank you! Your message has been sent.");
            setForm(EMPTY);
        } catch (err) {
            if (err.status === 429) setError("Too many messages in a short time. Please wait a minute and try again.");
            else {
                setFieldErr(err.errors || {});
                setError(err.message);
            }
        }
        setSending(false);
    };

    const email = site && site.contact_email;
    const phone = site && site.contact_phone;

    return (
        <section className="pg-wrap">


            <header className="pg-head-center">
                <span className="eyebrow">Get in touch</span>
                <h1>Contact us</h1>
                <p>Have a question, a suggestion or a problem? Send us a message and we will reply as soon as we can.</p>
            </header>

            <div className="ct-grid">
                <aside className="ct-info">
                    <div className="pg-card">
                        <span className="pg-ico">📧</span>
                        <b>Email</b>
                        {email ? <a href={"mailto:" + email}>{email}</a> : <small>Use the form to reach us.</small>}
                    </div>

                    {phone && (
                        <div className="pg-card">
                            <span className="pg-ico">📞</span>
                            <b>Phone</b>
                            <a href={"tel:" + String(phone).replace(/[^\d+]/g, "")}>{phone}</a>
                        </div>
                    )}

                    <div className="pg-card">
                        <span className="pg-ico">⏱️</span>
                        <b>Reply time</b>
                        <small>We usually reply within 1 to 2 working days.</small>
                    </div>
                </aside>

                <form className="ct-form pg-card" onSubmit={submit} noValidate>
                    {done && <div className="pg-ok" role="status">✅ {done}</div>}
                    {error && <div className="pg-bad" role="alert">{error}</div>}

                    <div className="pg-row2">
                        <label className="pg-field">
                            <span>Your name *</span>
                            <input className="pg-input" value={form.name} maxLength={100} autoComplete="name" onChange={(e) => set("name", e.target.value)} />
                            {firstError("name") && <small className="pg-err">{firstError("name")}</small>}
                        </label>
                        <label className="pg-field">
                            <span>Email *</span>
                            <input className="pg-input" type="email" value={form.email} maxLength={150} autoComplete="email" onChange={(e) => set("email", e.target.value)} />
                            {firstError("email") && <small className="pg-err">{firstError("email")}</small>}
                        </label>
                    </div>

                    <div className="pg-row2">
                        <label className="pg-field">
                            <span>Phone (optional)</span>
                            <input className="pg-input" type="tel" value={form.phone} maxLength={30} autoComplete="tel" onChange={(e) => set("phone", e.target.value)} />
                            {firstError("phone") && <small className="pg-err">{firstError("phone")}</small>}
                        </label>
                        <label className="pg-field">
                            <span>Subject (optional)</span>
                            <input className="pg-input" value={form.subject} maxLength={150} onChange={(e) => set("subject", e.target.value)} />
                        </label>
                    </div>

                    <label className="pg-field">
                        <span>Message * ({form.message.length}/{MAX})</span>
                        <textarea className="pg-input pg-area" value={form.message} maxLength={MAX} onChange={(e) => set("message", e.target.value)} />
                        {firstError("message") && <small className="pg-err">{firstError("message")}</small>}
                    </label>

                    {/* honeypot: hidden from people, bots fill it */}
                    <div className="pg-hp" aria-hidden="true">
                        <label>
                            Website
                            <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} />
                        </label>
                    </div>

                    <button type="submit" className="btn full" disabled={sending}>
                        {sending ? "Sending..." : "Send message"}
                    </button>
                </form>
            </div>
        </section>
    );
}

export default ContactScreen;