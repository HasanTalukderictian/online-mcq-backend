import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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

const themeIcon = (dark, size = 18) =>
    dark ? (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );

function Header({ screen, theme, onToggleTheme, onNav, user, onLogout, site }) {
    const dark = theme === "dark";
    const inPanel = screen === "panel" || screen === "detail";
    const [open, setOpen] = useState(false);
    const headerRef = useRef(null);

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

    // Menu items (desktop + mobile drawer duto-i ekhan theke ashe)
    const items = [
        { key: "start",     label: "Home",          icon: "🏠", target: "start",     on: screen === "start",     show: !isAdmin, desk: false },
        { key: "exam",      label: "Exam",          icon: "📝", target: "exam",      on: screen === "quiz",      show: true,     desk: true },
        { key: "circulars", label: "Circulars",     icon: "💼", target: "circulars", on: screen === "circulars", show: true,     desk: true },
        { key: "topics",    label: "Topics",        icon: "📌", target: "topics",    on: screen === "topics",    show: !isAdmin, desk: true },
        { key: "panel",     label: "Student Panel", icon: "📊", target: "panel",     on: inPanel,                show: !isAdmin, desk: true },
        { key: "about",     label: "About Us",      icon: "ℹ️", target: "about",     on: screen === "about",     show: true,     desk: true },
        { key: "contact",   label: "Contact",       icon: "✉️", target: "contact",   on: screen === "contact",   show: true,     desk: true },
        { key: "admin",     label: "Dashboard",     icon: "🛠️", target: "admin",     on: screen === "admin",     show: isAdmin,  desk: true },
        { key: "login",     label: "Login",         icon: "🔑", target: "login",     on: screen === "login",     show: !user,    desk: true },
    ].filter((i) => i.show);

    const doLogout = () => {
        setOpen(false);
        onLogout();
    };

    // ===== Mobile drawer (admin sidebar er moto) =====
    const drawer = (
        <>
            <div
                className={"mnav-bg " + (open ? "show" : "")}
                onClick={() => setOpen(false)}
                aria-hidden="true"
            />

            <aside
                id="mobile-nav"
                className={"mnav " + (open ? "open" : "")}
                aria-label="Main"
                aria-hidden={!open}
            >
                <div className="mnav-top">
                    <div className="mnav-logo">
                        <i>✓</i>
                        <span>{site.site_name}</span>
                    </div>
                    <button type="button" className="mnav-x" onClick={() => setOpen(false)} aria-label="Close menu">
                        ✕
                    </button>
                </div>

                <nav className="mnav-list">
                    {items.map((i) => (
                        <button
                            key={i.key}
                            type="button"
                            className={"mnav-item " + (i.on ? "on" : "")}
                            onClick={() => go(i.target)}
                        >
                            <span className="mnav-ico">{i.icon}</span>
                            {i.label}
                        </button>
                    ))}
                </nav>

                <div className="mnav-foot">
                    {user && (
                        <div className="mnav-user">
                            <div className="mnav-av">
                                {String(user.name || "?").trim().charAt(0).toUpperCase()}
                            </div>
                            <div className="mnav-who">
                                <b>{user.name}</b>
                                <small>{isAdmin ? "Admin" : "Student"}</small>
                            </div>
                        </div>
                    )}

                    <div className="mnav-acts">
                        <button type="button" className="mnav-act" onClick={onToggleTheme}>
                            {themeIcon(dark, 16)}
                            {dark ? "Day mode" : "Night mode"}
                        </button>
                        {user && (
                            <button type="button" className="mnav-act" onClick={doLogout}>
                                🚪 Logout
                            </button>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );

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

                {/* ===== Desktop nav ===== */}
                <nav className="head-right" aria-label="Main">
                    <div className="menu-scroll">
                        <span className={"status " + (screen === "quiz" ? "live" : "")}>
                            {labels[screen]}
                        </span>

                        {items.filter((i) => i.desk).map((i) => (
                            <button
                                key={i.key}
                                type="button"
                                className={"nav-btn " + (i.on ? "on" : "")}
                                onClick={() => go(i.target)}
                            >
                                {i.label}
                            </button>
                        ))}

                        {user && (
                            <button type="button" className="nav-btn" onClick={doLogout}>
                                Logout
                            </button>
                        )}

                        <button
                            type="button"
                            className="theme-btn"
                            onClick={onToggleTheme}
                            aria-label={dark ? "Switch to day mode" : "Switch to night mode"}
                            title={dark ? "Day mode" : "Night mode"}
                        >
                            {themeIcon(dark)}
                        </button>
                    </div>
                </nav>
            </div>

            {/* Drawer ta body te render hoy, tai header er CSS ta ke bhangte pare na */}
            {typeof document !== "undefined" && createPortal(drawer, document.body)}
        </header>
    );
}

export default Header;