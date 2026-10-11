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
};

function Header({ screen, theme, onToggleTheme, onNav, user, onLogout, site }) {
    const dark = theme === "dark";
    const inPanel = screen === "panel" || screen === "detail";
    const [open, setOpen] = useState(false);
    const headerRef = useRef(null);

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
                <button type="button" className="logo" onClick={() => go("start")} title="Go to Home">
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

                <nav id="mobile-nav" className={"head-right " + (open ? "open" : "")} aria-label="Main">
                    <div className="menu-scroll">
                        <span className={"status " + (screen === "quiz" ? "live" : "")}>
                            {labels[screen]}
                        </span>

                        <button
                            type="button"
                            className={"nav-btn " + (screen === "quiz" ? "on" : "")}
                            onClick={() => go("exam")}
                        >
                            Exam
                        </button>

                        <button
                            type="button"
                            className={"nav-btn " + (screen === "topics" ? "on" : "")}
                            onClick={() => go("topics")}
                        >
                            Topics
                        </button>

                        <button
                            type="button"
                            className={"nav-btn " + (screen === "circulars" ? "on" : "")}
                            onClick={() => go("circulars")}
                        >
                            Circulars
                        </button>

                        <button
                            type="button"
                            className={"nav-btn " + (inPanel ? "on" : "")}
                            onClick={() => go("panel")}
                        >
                            Student Panel
                        </button>

                        {user ? (
                            <>
                                {isAdminUser(user) && (
                                    <button
                                        type="button"
                                        className="nav-btn"
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

                        <button
                            type="button"
                            className="theme-btn"
                            onClick={onToggleTheme}
                            aria-label={dark ? "Switch to day mode" : "Switch to night mode"}
                            title={dark ? "Day mode" : "Night mode"}
                        >
                            {dark ? "Day" : "Night"}
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
}

export default Header;