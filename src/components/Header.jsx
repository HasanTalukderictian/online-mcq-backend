import { useState, useEffect, useRef } from "react";
import { isAdminUser } from "./Auth/roles";
import '../css/Header.css';

const labels = {
    start: "Home",
    topics: "Important Topics",
    circulars: "Circulars",
    quiz: "Exam in progress",
    result: "Result",
    panel: "Student Panel",
    detail: "Record details",
    login: "Sign in",
    register: "Sign up",
    admin: "Admin Dashboard",
    about: "About",
    contact: "Contact",
};

function Header({ screen, theme, onToggleTheme, onNav, user, onLogout, site }) {
    const dark = theme === "dark";
    const inPanel = screen === "panel" || screen === "detail";
    const [open, setOpen] = useState(false);
    const headerRef = useRef(null);

    // ✅ Admin check
    const isAdmin = !!user && isAdminUser(user);

    useEffect(() => { setOpen(false); }, [screen]);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    useEffect(() => {
        if (!window.matchMedia) return undefined;
        const mq = window.matchMedia("(min-width: 961px)");
        const onChange = (e) => { if (e.matches) setOpen(false); };
        if (mq.addEventListener) mq.addEventListener("change", onChange);
        else mq.addListener(onChange);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", onChange);
            else mq.removeListener(onChange);
        };
    }, []);

    // dynamically set --header-h
    useEffect(() => {
        const setH = () => {
            if (headerRef.current) {
                const h = headerRef.current.offsetHeight;
                document.documentElement.style.setProperty("--header-h", h + "px");
            }
        };
        setH();
        window.addEventListener("resize", setH);
        window.addEventListener("orientationchange", setH);
        return () => {
            window.removeEventListener("resize", setH);
            window.removeEventListener("orientationchange", setH);
        };
    }, []);

    const go = (target) => {
        setOpen(false);
        onNav(target);
    };

    return (
        <header className="site-header" ref={headerRef}>
            <div className="site-header-in">
                <button
                    type="button"
                    className="logo"
                    onClick={() => go(isAdmin ? "admin" : "start")}
                    title="Go to Home"
                >
                    <i>✓</i> <span className="logo-text">{site.site_name}</span>
                </button>

                <button
                    type="button"
                    className={"menu-btn " + (open ? "on" : "")}
                    onClick={() => setOpen(!open)}
                    aria-label={open ? "Close menu" : "Open menu"}
                    aria-expanded={open}
                    aria-controls="mobile-nav"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                {open && (
                    <div
                        className="menu-backdrop"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                )}

                <nav
                    id="mobile-nav"
                    className={"head-right " + (open ? "open" : "")}
                    aria-label="Main"
                >
                    <div className="menu-scroll">
                        <span className={"status " + (screen === "quiz" ? "live" : "")}>
                            {labels[screen]}
                        </span>

                        {/* ============ EXAM — visible for all ============ */}
                        <button
                            type="button"
                            className={"nav-btn " + (screen === "quiz" ? "on" : "")}
                            onClick={() => go("exam")}
                        >
                            Exam
                        </button>

                        {/* ============ CIRCULARS — visible for all ============ */}
                        <button
                            type="button"
                            className={"nav-btn " + (screen === "circulars" ? "on" : "")}
                            onClick={() => go("circulars")}
                        >
                            Circulars
                        </button>

                        {/* ============ STUDENT-ONLY ITEMS (hidden for admin) ============ */}
                        {!isAdmin && (
                            <>
                                <button
                                    type="button"
                                    className={"nav-btn " + (screen === "topics" ? "on" : "")}
                                    onClick={() => go("topics")}
                                >
                                    Topics
                                </button>

                                <button
                                    type="button"
                                    className={"nav-btn " + (inPanel ? "on" : "")}
                                    onClick={() => go("panel")}
                                >
                                    Student Panel
                                </button>
                            </>
                        )}

                        {/* ============ COMMON PAGES ============ */}
                        <button
                            type="button"
                            className={"nav-btn " + (screen === "about" ? "on" : "")}
                            onClick={() => go("about")}
                        >
                            <b>About Us</b>
                        </button>

                        <button
                            type="button"
                            className={"nav-btn " + (screen === "contact" ? "on" : "")}
                            onClick={() => go("contact")}
                        >
                            <b>Contact</b>
                        </button>

                        {/* ============ AUTH AREA ============ */}
                        {user ? (
                            <>
                                {isAdmin && (
                                    <button
                                        type="button"
                                        className={"nav-btn " + (screen === "admin" ? "on" : "")}
                                        onClick={() => go("admin")}
                                    >
                                        Dashboard
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="nav-btn"
                                    onClick={() => {
                                        setOpen(false);
                                        onLogout();
                                    }}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className={"nav-btn " + (screen === "login" ? "on" : "")}
                                onClick={() => go("login")}
                            >
                                Login
                            </button>
                        )}

                        {/* ============ THEME TOGGLE (icon only) ============ */}
                        <button
                            type="button"
                            className="theme-btn"
                            onClick={onToggleTheme}
                            aria-label={dark ? "Switch to day mode" : "Switch to night mode"}
                            title={dark ? "Day mode" : "Night mode"}
                        >
                            {dark ? (
                                // ☀️ Sun icon
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="4" />
                                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                                </svg>
                            ) : (
                                // 🌙 Moon icon
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
}

export default Header;