import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import Subjects from "./Subjects";
import Exams from "./Exams";
import Questions from "./Questions";
import ImportData from "./ImportData";
import Users from "./Users";
import Students from "./Students";
import Results from "./Results";
import Settings from "./Settings";
import "./css/admin.css";
import "./css/admin-extra.css";
import Topics from "./Topics";
import CircularsAdmin from "./CircularsAdmin";
import NoticesAdmin from "./NoticesAdmin";
import MessagesAdmin from "./MessagesAdmin";
import TeamAdmin from "./TeamAdmin";
import { apiRequest, getData } from "./api";
import PyqAdmin from "./PyqAdmin";


const MENU = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "subjects", icon: "📚", label: "Subjects" },
    { id: "exams", icon: "📝", label: "Exams" },
    { id: "questions", icon: "❓", label: "Questions" },
    { id: "import", icon: "⬆️", label: "Import data" },
    { id: "users", icon: "👤", label: "Users" },
    { id: "students", icon: "👥", label: "Students" },
    { id: "results", icon: "🏆", label: "Results" },
    { id: "topics", icon: "📌", label: "Important topics" },
    { id: "circulars", icon: "💼", label: "Job circulars" },
    { id: "notices", icon: "📢", label: "Notices" },
    { id: "messages", icon: "✉️", label: "Messages" },
    { id: "pyq", icon: "🗂️", label: "PYQ solutions" },
    { id: "team", icon: "🧑‍💻", label: "Team" },
    { id: "settings", icon: "⚙️", label: "Settings" },

];

// the open admin page is remembered, so a refresh does not send you back to the dashboard
const PAGE_KEY = "admin_page_v1"; // same key as in App.jsx

const loadNav = () => {
    try {
        const v = JSON.parse(sessionStorage.getItem(PAGE_KEY));
        if (v && MENU.some((m) => m.id === v.page)) return { page: v.page, params: v.params || {} };
    } catch { }
    return { page: "dashboard", params: {} };
};

function ComingSoon({ title }) {
    return (
        <div className="adm-card adm-soon">
            <div style={{ fontSize: 44 }}>🚧</div>
            <h2>{title}</h2>
            <p>This page will be added next.</p>
        </div>
    );
}

function AdminPanel({ user, token, theme, onToggleTheme, onLogout, onExit, onUserUpdate }) {
    const [nav, setNav] = useState(loadNav); // { page, params }
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);


    const page = nav.page;
    const params = nav.params || {};

    const u = user || {};
    const dark = theme === "dark";
    const current = MENU.find((m) => m.id === page) || MENU[0];
    const initial = (u.name ? u.name : "A").charAt(0).toUpperCase();

    useEffect(() => {
        try { sessionStorage.setItem(PAGE_KEY, JSON.stringify(nav)); } catch { }
    }, [nav]);



    // unread contact messages for the menu badge
    useEffect(() => {
        let alive = true;
        apiRequest("/contact-messages/unread-count", { token: token })
            .then((b) => {
                const d = getData(b) || {};
                if (alive) setUnread(d.unread || 0);
            })
            .catch(() => { });
        return () => {
            alive = false;
        };
    }, [page, token]);

    // go to a page, optionally with a filter (e.g. choose("exams", { subject_id: 3 }))
    const choose = (id, p) => {
        setNav({ page: id, params: p || {} });
        setOpen(false);
        window.scrollTo({ top: 0 });
    };

    const common = { token: token, onUnauthorized: onLogout, go: choose };

    let content;
    if (page === "dashboard") content = <Dashboard user={u} {...common} />;
    else if (page === "subjects") content = <Subjects {...common} />;
    else if (page === "exams") content = <Exams key={"e" + (params.subject_id || "all")} subjectId={params.subject_id} {...common} />;
    else if (page === "questions") content = <Questions key={"q" + (params.exam_id || "all")} examId={params.exam_id} {...common} />;
    else if (page === "import") content = <ImportData {...common} />;
    else if (page === "users") content = <Users token={token} me={u} onUnauthorized={onLogout} />;
    else if (page === "students") content = <Students token={token} onUnauthorized={onLogout} />;
    else if (page === "results") content = <Results token={token} onUnauthorized={onLogout} />;
    else if (page === "topics") content = <Topics {...common} />;
    else if (page === "circulars") content = <CircularsAdmin token={token} onUnauthorized={onLogout} />;
    else if (page === "messages") content = <MessagesAdmin token={token} onUnauthorized={onLogout} onUnreadChange={setUnread} />;
    else if (page === "team") content = <TeamAdmin token={token} onUnauthorized={onLogout} />;
    else if (page === "notices") content = <NoticesAdmin token={token} onUnauthorized={onLogout} />;
    else if (page === "settings") content = <Settings token={token} user={u} onUnauthorized={onLogout} onUserUpdate={onUserUpdate} />;
    else if (page === "pyq") content = <PyqAdmin token={token} onUnauthorized={onLogout} />;
    else content = <ComingSoon title={current.label} />;

    return (
        <div className="adm-shell">
            {/* Sidebar */}
            <aside className={"adm-side " + (open ? "open" : "")}>
                <div className="adm-brand"><i>✓</i> Exam Admin</div>

                <nav className="adm-menu">
                    {MENU.map((m) => (
                        <button key={m.id} type="button" className={page === m.id ? "on" : ""} onClick={() => choose(m.id)}>
                            <span>{m.icon}</span> {m.label}
                            {m.id === "messages" && unread > 0 && <em className="adm-badge">{unread}</em>}
                        </button>


                    ))}


                </nav>

                <div className="adm-side-foot">
                    <div className="adm-avatar">{initial}</div>
                    <div>
                        <b>{u.name}</b>
                        <small>{u.role}</small>
                    </div>
                </div>
            </aside>
            {open && <div className="adm-backdrop" onClick={() => setOpen(false)} />}

            <div className="adm-body">
                {/* Header */}
                <header className="adm-head">
                    <button type="button" className="adm-burger" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
                    <h1>{current.icon} {current.label}</h1>

                    <div className="adm-head-right">
                        <button
                            type="button"
                            className="theme-btn"
                            onClick={onToggleTheme}
                            aria-label={dark ? "Switch to day mode" : "Switch to night mode"}
                        >
                            <span>{dark ? "☀️" : "🌙"}</span>
                            <b>{dark ? "Day" : "Night"}</b>
                        </button>
                        <button type="button" className="nav-btn" onClick={onExit}>🌐 <b>View site</b></button>
                        <button type="button" className="nav-btn" onClick={onLogout}>Logout</button>
                    </div>
                </header>

                {/* Page content */}
                <main className="adm-main">{content}</main>

                {/* Footer */}
                <footer className="adm-foot">
                    <span>© {new Date().getFullYear()} Online Exam Portal. All rights reserved.</span>
                    <span>
                        Developed by{" "}
                        <a className="dev-link" href="https://hasan-portfilo.netlify.app/" target="_blank" rel="noopener noreferrer">
                            Hasan Talukder
                        </a>
                    </span>
                </footer>
            </div>
        </div>
    );
}

export default AdminPanel;