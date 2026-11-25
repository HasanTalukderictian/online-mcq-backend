import { useState } from "react";
import { apiRequest, fieldErrors } from "../../adminpanel/api";

const mailIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
    </svg>
);

function ForgotPassword({ onBack }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        const value = email.trim();
        if (!value || !/^\S+@\S+\.\S+$/.test(value)) return setError("Please enter a valid email address.");
        setLoading(true);
        setError("");
        try {
            const body = await apiRequest("/forgot-password", { method: "POST", body: { email: value } });
            setSent(body.message || "If an account exists for this email, a reset link has been sent.");
        } catch (err) {
            if (err.status === 429) setError("Too many requests. Please wait a minute and try again.");
            else setError(fieldErrors(err).email || err.message);
        }
        setLoading(false);
    };

    return (
        <div className="auth">
            <aside className="auth-side">
                <div className="auth-logo"><i>✓</i> Online Exam Portal</div>
                <h2>Forgot your password? 🔑</h2>
                <p>No problem. Enter the email you signed up with and we will send you a link to set a new password.</p>
                <ul>
                    <li>The link works once</li>
                    <li>It expires after 60 minutes</li>
                    <li>Check your spam folder too</li>
                </ul>
                <span className="auth-orb o1" /><span className="auth-orb o2" />
            </aside>

            <form className="auth-form" onSubmit={submit} noValidate>
                <h1>Reset password</h1>

                {sent ? (
                    <>
                        <div className="auth-note" role="status">📧 {sent}</div>
                        <p className="sub">Didn't get it? Wait a minute, then try again.</p>
                        <button type="button" className="btn full" onClick={onBack}>Back to sign in</button>
                        <p className="auth-switch">
                            <button type="button" className="link-btn" onClick={() => setSent("")}>Send again</button>
                        </p>
                    </>
                ) : (
                    <>
                        <p className="sub">We'll email you a reset link.</p>
                        {error && <div className="auth-error" role="alert">⚠️ {error}</div>}

                        <label className="label" htmlFor="fp-email">Email</label>
                        <div className="auth-input">
                            {mailIcon}
                            <input
                                id="fp-email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                autoFocus
                            />
                        </div>

                        <button className="btn full" disabled={loading}>
                            {loading ? <><span className="spin" /> Sending...</> : "Send reset link"}
                        </button>

                        <p className="auth-switch">
                            Remembered it?{" "}
                            <button type="button" className="link-btn" onClick={onBack}>Back to sign in</button>
                        </p>
                    </>
                )}
            </form>
        </div>
    );
}

export default ForgotPassword;
