// Every page of the site has its own URL.
// screen name (used inside App) -> URL path
export const ROUTES = {
    start: "/",
    exam: "/exam",
    model: "/model-test",
    circulars: "/circulars",
    topics: "/topics",
    pyq: "/question-bank",
    essential: "/essential-tools",
    panel: "/student-panel",
    detail: "/student-panel/result",
    about: "/about-us",
    contact: "/contact",
    admin: "/dashboard",
    login: "/login",
    register: "/register",
    forgot: "/forgot-password",
    reset: "/reset-password",
    quiz: "/exam/live",
    result: "/exam/result",
    notfound: "/404",
};

// Old or short URLs that should still work
const ALIASES = {
    "/home": "start",
    "/index.html": "start",
    "/exams": "exam",
    "/model": "model",
    "/model-tests": "model",
    "/circular": "circulars",
    "/topic": "topics",
    "/pyq": "pyq",
    "/questions": "pyq",
    "/essential": "essential",
    "/tools": "essential",
    "/panel": "panel",
    "/student": "panel",
    "/about": "about",
    "/admin": "admin",
    "/signin": "login",
    "/sign-in": "login",
    "/signup": "register",
    "/sign-up": "register",
    "/forgot": "forgot",
    "/password/reset": "reset",
};

// Supports deploying in a sub-folder (Vite `base` option)
const BASE = ((
    import.meta.env &&
    import.meta.env.BASE_URL) || "/").replace(/\/+$/, "");

const clean = (p) => {
    let path = p || "/";
    if (BASE && path.startsWith(BASE)) path = path.slice(BASE.length) || "/";
    path = path.replace(/\/+$/, "") || "/";
    return path.toLowerCase();
};

const PATH_TO_SCREEN = Object.fromEntries(Object.entries(ROUTES).map(([screen, path]) => [path, screen]));

export const screenFromPath = (pathname) => {
    const path = clean(pathname);
    return PATH_TO_SCREEN[path] || ALIASES[path] || "notfound";
};

export const pathFor = (screen) => BASE + (ROUTES[screen] || "/");

// Page titles (browser tab)
export const TITLES = {
    start: "Home",
    exam: "Exam",
    model: "Model Test",
    circulars: "Circulars",
    topics: "Important Topics",
    pyq: "Question Bank",
    essential: "Essential Tools",
    panel: "Student Panel",
    detail: "Result details",
    about: "About Us",
    contact: "Contact",
    admin: "Dashboard",
    login: "Login",
    register: "Sign up",
    forgot: "Forgot password",
    reset: "Reset password",
    quiz: "Exam in progress",
    result: "Result",
    notfound: "Page not found",
};