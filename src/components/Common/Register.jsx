import { useState } from "react";
import { registerRequest, saveAuth } from "../Auth/Auth";

const DEGREES = [
    "CSE", "ICT", "ICE", "EEE", "ETE", "ECE", "Software Engineering",
    "Computer Engineering", "Computer Science", "Information Technology",
    "Information Systems", "Data Science", "Cyber Security", "AI & Machine Learning",
    "BBA", "Management", "Accounting", "Finance", "Marketing", "Economics",
    "English", "Bangla", "Law", "Education", "Political Science",
    "Public Administration", "Sociology", "Social Work", "Mathematics",
    "Statistics", "Physics", "Chemistry", "Biology", "Civil Engineering",
    "Mechanical Engineering", "Electrical Engineering", "Architecture",
    "Textile Engineering", "Industrial & Production Engineering",
    "Chemical Engineering", "Medicine", "Nursing", "Pharmacy", "Agriculture", "Others"
];

const blank = {
    name: "", email: "", phone: "", university: "", degree: "",
    password: "", password_confirmation: "",
};

function Field({ id, label, error, full, children }) {
    return (
        <div className={"rg-field" + (full ? " full" : "")}>
            <label className="label" htmlFor={id}>{label}</label>
            {children}
            {error && <div className="f-err">{error}</div>}
        </div>
    );
}

function Register({ onSuccess, onSwitch, reason }) {
    const [pendingMsg, setPendingMsg] = useState("");
    
    const [form, setForm] = useState(blank);
    const [fe, setFe] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);

    const set = (k) => (e) => {
        setForm({ ...form, [k]: e.target.value });
        setFe({ ...fe, [k]: "" });
        setError("");
    };
    const cls = (k) => "field" + (fe[k] ? " invalid" : "");

    const validate = () => {
        const er = {};
        if (!form.name.trim()) er.name = "Enter your full name.";
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) er.email = "Enter a valid email address.";
        if (!/^\+?[0-9][0-9\s-]{6,18}$/.test(form.phone.trim())) er.phone = "Enter a valid phone number.";
        if (!form.university.trim()) er.university = "Enter your university.";
        if (!form.degree.trim()) er.degree = "Enter your graduation degree.";
        if (form.password.length < 6) er.password = "Use at least 6 characters.";
        if (form.password !== form.password_confirmation) er.password_confirmation = "Passwords do not match.";
        return er;
    };

    const submit = async (e) => {
        e.preventDefault();
        const er = validate();
        setFe(er);
        if (Object.keys(er).length) return;

        setLoading(true);
        setError("");
        try {
            const data = await registerRequest({
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                university: form.university.trim(),
                degree: form.degree.trim(),
                password: form.password,
                password_confirmation: form.password_confirmation,
            });

            if (data.pending) {
                setPendingMsg(data.message);
                setLoading(false);
                return;
            }
            saveAuth(data, true);
            onSuccess(data.user, data.token);
        } catch (err) {
            const fields = err.fields || {};
            setFe(fields);
            setError(Object.keys(fields).length ? "Please fix the highlighted fields." : err.message);
            setLoading(false);
        }
    };

    // ✅ Registration Complete Message & UI
    if (pendingMsg) {
        return (
            <div className="auth reg">
                <div className="auth-form" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                    
                    <h1 style={{ color: "#1f2937", marginBottom: 8 }}>Registration Successful!</h1>
                    
                    <p className="sub" style={{ fontSize: 16, marginBottom: 24 }}>
                        {pendingMsg}
                    </p>

                    <div style={{ 
                        background: "#f8fafc", 
                        border: "1px solid #e2e8f0", 
                        borderRadius: "8px", 
                        padding: "20px", 
                        marginBottom: 24, 
                        textAlign: "left" 
                    }}>
                        <h4 style={{ margin: "0 0 12px 0", color: "#3347d6", fontSize: 15 }}>📋 Next Steps:</h4>
                        
                        <ul style={{ margin: 0, paddingLeft: 20, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
                            <li style={{ marginBottom: 8 }}>
                                <b>Admin Approval:</b> Your account is currently under review. Please wait for the admin to approve it.
                            </li>
                            <li style={{ marginBottom: 8 }}>
                                <b>Login Restriction:</b> You cannot log in or take exams until your account is approved.
                            </li>
                            <li>
                                <b>Need Help?</b> If it takes too long, please contact the admin.
                            </li>
                        </ul>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                        {/* Contact Admin Button */}
                        <a 
                            href="mailto:hasantalukdercou@gmail.com" 
                            className="btn full" 
                            style={{ 
                                textDecoration: "none", 
                                textAlign: "center",
                                background: "#3347d6",
                                color: "#fff",
                                borderRadius: "4px",
                                padding: "12px 24px",
                                display: "block",
                                width: "100%",
                                maxWidth: "300px"
                            }}
                        >
                          Contact Admin
                        </a>

                        
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth reg">
            <aside className="auth-side">
                <div className="auth-logo"><i>✓</i> Online Exam Portal</div>
                <h2>Create your account ✨</h2>
                <p>Sign up once, then take as many exams as you like and keep track of your progress.</p>
                <ul>
                    <li>Free and quick to join</li>
                    <li>Take timed MCQ exams</li>
                    <li>See your results and history</li>
                </ul>
                <span className="auth-orb o1" /><span className="auth-orb o2" />
            </aside>

            <form className="auth-form" onSubmit={submit} noValidate>
                <h1>Sign up</h1>
                <p className="sub">Tell us a little about yourself to get started.</p>

                {reason && <div className="auth-note">📝 Please sign up first to take your exam. It only takes a minute.</div>}
                {error && <div className="auth-error" role="alert">⚠️ {error}</div>}

                <div className="rg-grid">
                    <Field id="r-name" label="Full name" error={fe.name}>
                        <input id="r-name" className={cls("name")} autoComplete="name" placeholder="Your full name"
                            value={form.name} onChange={set("name")} autoFocus />
                    </Field>
                    <Field id="r-phone" label="Phone" error={fe.phone}>
                        <input id="r-phone" type="tel" className={cls("phone")} autoComplete="tel" placeholder="01XXXXXXXXX"
                            value={form.phone} onChange={set("phone")} />
                    </Field>

                    <Field id="r-email" label="Email" error={fe.email}>
                        <input id="r-email" type="email" className={cls("email")} autoComplete="email" placeholder="you@example.com"
                            value={form.email} onChange={set("email")} />
                    </Field>

                    <Field id="r-uni" label="University" error={fe.university}>
                        <input id="r-uni" className={cls("university")} placeholder="Your university"
                            value={form.university} onChange={set("university")} />
                    </Field>
                    <Field id="r-degree" label="Graduation Subject" error={fe.degree}>
                        <input id="r-degree" className={cls("degree")} list="degree-list" placeholder="e.g. B.Sc."
                            value={form.degree} onChange={set("degree")} />
                        <datalist id="degree-list">
                            {DEGREES.map((d) => <option key={d} value={d} />)}
                        </datalist>
                    </Field>

                    <Field id="r-pass" label="Password" error={fe.password}>
                        <input id="r-pass" type={show ? "text" : "password"} className={cls("password")} autoComplete="new-password"
                            placeholder="At least 6 characters" value={form.password} onChange={set("password")} />
                    </Field>
                    <Field id="r-pass2" label="Confirm password" error={fe.password_confirmation}>
                        <input id="r-pass2" type={show ? "text" : "password"} className={cls("password_confirmation")} autoComplete="new-password"
                            placeholder="Repeat password" value={form.password_confirmation} onChange={set("password_confirmation")} />
                    </Field>
                </div>

                <label className="auth-remember">
                    <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords
                </label>

                <button className="btn full" disabled={loading}>
                    {loading ? <><span className="spin" /> Creating account...</> : "Create account"}
                </button>

                <p className="auth-switch">
                    Already have an account?{" "}
                    <button type="button" className="link-btn" onClick={onSwitch}>Sign in</button>
                </p>
            </form>
        </div>
    );
}

export default Register;