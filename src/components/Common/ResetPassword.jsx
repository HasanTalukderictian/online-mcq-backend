import { useState } from "react";
import { apiRequest, fieldErrors } from "../../adminpanel/api";

const Icon = ({ d }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {d}
    </svg>
);
const lock = <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>;
const eye = <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>;
const eyeOff = <><path d="M3 3l18 18" /><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 6.7A16.6 16.6 0 0 0 2 12s3.5 6 10 6a9.7 9.7 0 0 0 4.3-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>;

// token + email come from the link in the email: /reset-password?token=...&email=...
const readLink = () => {
    try {
        const q = new URLSearchParams(window.location.search);
        return { token: q.get("token") || "", email: q.get("email") || "" };
    } catch {
        return { token: "", email: "" };
    }
};

function ResetPassword({ onDone, onForgot }) {
    const [{ token, email }] = useState(readLink);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        if (password.length < 6) return setError("Password must be at least 6 characters.");
        if (password !== confirm) return setError("The two passwords do not match.");
        setLoading(true);
        setError("");
        try {
            const body = await apiRequest("/reset-password", {
                method: "POST",
                body: { token, email, password, password_confirmation: confirm },
            });
            onDone(body.message || "Your password has been changed. Please sign in.");
        } catch (err) {
            const f = fieldErrors(err);
            setError(f.password || f.email || f.token || err.message);
            setLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className="panel loading-box" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48 }}>🔗</div>
                <h2>Invalid reset link</h2>
                <p>This link is incomplete. Please open the link from your email again, or request a new one.</p>
                <button className="btn" onClick={onForgot}>Request a new link</button>
            </div>
        );
    }

    return (
        <div className="auth">
            <aside className="auth-side">
                <div className="auth-logo"><i>✓</i> Online Exam Portal</div>
                <h2>Choose a new password 🔒</h2>
                <p>Pick a password you haven't used here before. You will be signed out of all other devices.</p>
                <ul>
                    <li>At least 6 characters</li>
                    <li>Mix letters, numbers and symbols</li>
                    <li>Don't share it with anyone</li>
                </ul>
                <span className="auth-orb o1" /><span className="auth-orb o2" />
            </aside>

            <form className="auth-form" onSubmit={submit} noValidate>
                <h1>New password</h1>
                <p className="sub">For <b>{email}</b></p>

                {error && (
                    <div className="auth-error" role="alert">
                        ⚠️ {error}
                        {/expired|invalid/i.test(error) && (
                            <> <button type="button" className="link-btn" onClick={onForgot}>Get a new link</button></>
                        )}
                    </div>
                )}

                <label className="label" htmlFor="rp-pass">New password</label>
                <div className="auth-input">
                    <Icon d={lock} />
                    <input
                        id="rp-pass"
                        type={show ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        autoFocus
                    />
                    <button type="button" className="auth-eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
                        <Icon d={show ? eyeOff : eye} />
                    </button>
                </div>

                <label className="label" htmlFor="rp-confirm">Confirm new password</label>
                <div className="auth-input">
                    <Icon d={lock} />
                    <input
                        id="rp-confirm"
                        type={show ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Type it again"
                        value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                    />
                </div>

                <button className="btn full" disabled={loading}>
                    {loading ? <><span className="spin" /> Saving...</> : "Change password"}
                </button>
            </form>
        </div>
    );
}

export default ResetPassword;
