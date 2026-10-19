import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import StartScreen from "./components/StartScreen";
import QuizScreen from "./components/QuizScreen";
import ResultScreen from "./components/ResultScreen";
import StudentPanel from "./components/StudentPanel";
import Login from "./components/Common/Login";
import Register from "./components/Common/Register";
import AdminPanel from "./adminpanel/AdminPanel";

import { apiRequest, getData } from "./adminpanel/api";
import { getAuth, clearAuth, logoutRequest, updateStoredUser } from "./components/Auth/Auth";
import { isAdminUser } from "./components/Auth/roles";
import "./css/exam.css";
import CircularsScreen from "./components/CircularsScreen";
import AboutScreen from "./components/AboutScreen";
import ContactScreen from "./components/ContactScreen";
import TopicsScreen from "./components/TopicsScreen";
import PyqScreen from "./components/Common/PyqScreen";
import ModelTestsScreen from "./components/Common/ModelTestsScreen";
import ModelHistory from "./components/Common/ModelHistory";

const SCREEN_KEY = "app_screen_v1";
const ADMIN_PAGE_KEY = "admin_page_v1";

const initialScreen = () => {
    const a = getAuth();
    let saved = "";
    try {
        saved = sessionStorage.getItem(SCREEN_KEY) || "";
    } catch { }

    if (!saved) return a && isAdminUser(a.user) ? "admin" : "start";
    if (saved === "quiz") return "start";
    if (saved === "result" || saved === "detail") return a ? "panel" : "start";
    if (saved === "admin" && !(a && isAdminUser(a.user))) return "start";
    if ((saved === "login" || saved === "register") && a) return "start";

    return ["start", "login", "register", "panel", "admin", "topics", "circulars", "about", "contact", "pyq", "model"].includes(saved) ? saved : "start";
};

const DEFAULT_SITE = {
    site_name: "Online Exam Portal",
    site_tagline: "",
    hero_title: "ONLINE MCQ TEST",
    hero_text: "Boost your exam preparation with dynamic MCQ tests across multiple subjects. Evaluate your skills with a live timer, question palette and instant results.",
    footer_text: "",
    contact_email: "",
    contact_phone: "",
    registration_open: true,
    maintenance_mode: false,
    maintenance_message: "",
};

// API attempt -> props for ResultScreen (Exam)
const toResult = (a) => {
    const items = a.items || [];
    return {
        questions: items.map((i) => ({
            question: i.q,
            answer: i.ans !== null && i.ans !== undefined ? i.ans : i.ok ? i.sel : null,
        })),
        answers: Object.fromEntries(items.map((i, idx) => [idx, i.sel]).filter((p) => p[1])),
        timeUp: !!a.time_up,
        taken: a.time_taken,
        passMark: a.pass_mark || 60,
        serverPercent: a.percent,
        serverPassed: a.passed,
        score: a.score,
        penalty: a.penalty || 0,
        showAnswers: a.show_answers !== false,
        subjectName: a.subject + " - " + a.exam,
    };
};

// Model Test attempt -> props for ResultScreen
const toModelResult = (a, itemsData) => {
    const items = itemsData || [];
    return {
        questions: items.map((i) => ({
            question: i.q,
            answer: i.ans,
        })),
        answers: Object.fromEntries(items.map((i, idx) => [idx, i.sel]).filter((p) => p[1])),
        timeUp: !!a.time_up,
        taken: a.time_taken,
        passMark: 0,
        serverPercent: a.percent,
        serverPassed: true,
        score: a.score,
        penalty: a.negative_mark || 0,
        showAnswers: true,
        subjectName: "Model Test - " + a.name,
    };
};

function App() {
    const [auth, setAuth] = useState(getAuth);
    const [screen, setScreen] = useState(initialScreen);
    const [leaveAsk, setLeaveAsk] = useState(false);
    const [topicsFocus, setTopicsFocus] = useState(null);
    const [pending, setPending] = useState("start");
    const [pendingExam, setPendingExam] = useState(null);

    const [modelNotice, setModelNotice] = useState(null);
    const [modelError, setModelError] = useState("");
    const [startingModel, setStartingModel] = useState(null);
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        } catch {
            return "light";
        }
    });

    const [site, setSite] = useState(DEFAULT_SITE);
    const [catalog, setCatalog] = useState({ loading: true, error: "", subjects: [], stats: null });

    const [session, setSession] = useState(null);
    const [starting, setStarting] = useState(false);
    const [startError, setStartError] = useState("");
    const [result, setResult] = useState(null);
    const [record, setRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [pendingSubmit, setPendingSubmit] = useState(null);
    const submittingRef = useRef(false);

    const token = auth ? auth.token : null;
    const currentUser = auth ? auth.user : null;

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        try { localStorage.setItem("theme", theme); } catch { }
    }, [theme]);

    useEffect(() => {
        try { sessionStorage.setItem(SCREEN_KEY, screen); } catch { }
    }, [screen]);

    useEffect(() => {
        if (screen !== "quiz") return undefined;
        const warn = (e) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [screen]);

    useEffect(() => {
        apiRequest("/public/settings")
            .then((b) => setSite({ ...DEFAULT_SITE, ...(getData(b) || {}) }))
            .catch(() => { });
    }, []);

    useEffect(() => {
        document.title = site.site_name;
    }, [site.site_name]);

    const loadCatalog = async () => {
        setCatalog((c) => ({ ...c, loading: true, error: "" }));
        try {
            const body = await apiRequest("/public/subjects", { token });
            const d = getData(body) || {};
            setCatalog({ loading: false, error: "", subjects: d.subjects || [], stats: d.stats || null });
        } catch (err) {
            setCatalog({ loading: false, error: err.message, subjects: [], stats: null });
        }
    };

    useEffect(() => {
        loadCatalog();
    }, [token]);

    const forgetAdminPage = () => {
        try { sessionStorage.removeItem(ADMIN_PAGE_KEY); } catch { }
    };

    const forceLogout = () => {
        clearAuth();
        forgetAdminPage();
        setAuth(null);
        setScreen("login");
    };

    const updateUser = (user) => {
        updateStoredUser(user);
        setAuth((a) => (a ? { ...a, user } : a));
    };

    const openTopics = (subjectId) => {
        setTopicsFocus(subjectId || null);
        go("topics");
    };

    const startExam = async (examId, tok) => {
        setStarting(true);
        setStartError("");
        try {
            const body = await apiRequest("/student/exams/" + examId, { token: tok });
            const e = getData(body);
            setSession({ id: e.id, name: e.name, subject: e.subject, time: e.time, questions: e.questions });
            setScreen("quiz");
            window.scrollTo({ top: 0 });
        } catch (err) {
            if (err.status === 401) forceLogout();
            else {
                setStartError(err.message);
                if (err.status === 409) loadCatalog();
            }
        }
        setStarting(false);
    };

    const startModel = async (id) => {
        if (!auth) {
            setScreen("login");
            return;
        }
        setStartingModel(id);
        setModelError("");
        setModelNotice(null);
        try {
            const body = await apiRequest("/student/model-tests/" + id + "/start", { method: "POST", token: auth.token, body: {} });
            const e = getData(body);
            setSession({ kind: "model", id: e.id, name: e.name, subject: "Model Test", time: e.time, questions: e.questions });
            setScreen("quiz");
            window.scrollTo({ top: 0 });
        } catch (err) {
            if (err.status === 401) forceLogout();
            else setModelError(err.message);
        }
        setStartingModel(null);
    };

    const handleStart = (examId) => {
        if (!auth) {
            setPendingExam(examId);
            setScreen(site.registration_open ? "register" : "login");
            window.scrollTo({ top: 0 });
            return;
        }
        startExam(examId, auth.token);
    };

    const handleLogin = (user, tok) => {
        setAuth({ user, token: tok });
        window.scrollTo({ top: 0 });

        if (isAdminUser(user)) {
            setPendingExam(null);
            forgetAdminPage();
            setScreen("admin");
            return;
        }
        setScreen("start");
        if (pendingExam) {
            const id = pendingExam;
            setPendingExam(null);
            startExam(id, tok);
        }
    };

      const sendSubmit = async (data) => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);
        setSubmitError("");
        try {
            const endpoint = data.model 
                ? `/student/model-tests/${data.examId}/submit` 
                : `/student/exams/${data.examId}/submit`;

            const body = await apiRequest(endpoint, {
                method: "POST",
                token,
                body: data.body,
            });
            
            const resData = getData(body);

            // 👇 সাবমিটিং মডাল বন্ধ করা হলো
            setSubmitting(false);
            submittingRef.current = false;

            if (data.model) {
                setSession(null);
                setPendingSubmit(null);
                
                setModelNotice({
                    title: data.title,
                    message: resData.published 
                        ? "Submitted! Your result is ready in the Student Panel." 
                        : (resData.message || `Submitted! Result on ${resData.publish_on}`)
                });
                setScreen("model");
                window.scrollTo({ top: 0 });
                return;
            }

            setResult(toResult(resData));
            setPendingSubmit(null);
            setSession(null);
            setScreen("result");
            window.scrollTo({ top: 0 });
            loadCatalog();

        } catch (err) {
            // 👇 এরর হলেও সাবমিটিং মডাল বন্ধ হবে
            setSubmitting(false);
            submittingRef.current = false;

            if (err.status === 401) forceLogout();
            else if (err.status === 409) {
                setPendingSubmit(null);
                setSubmitError(err.message);
            } else setSubmitError(err.message);
        }
    };

    const handleFinish = (answers, timeUp, taken) => {
        const payload = {};
        session.questions.forEach((q, i) => {
            if (answers[i]) payload[q.id] = answers[i];
        });
        const data = {
            examId: session.id,
            model: session.kind === "model",
            title: session.name,
            body: { answers: payload, time_taken: taken, time_up: timeUp },
        };
        setPendingSubmit(data);
        sendSubmit(data);
    };

    const navigate = (target) => {
        if (target !== "model") {
            setModelNotice(null);
            setModelError("");
        }
        if (target === "admin" && !(auth && isAdminUser(auth.user))) target = "start";
        if (target !== "login" && target !== "register") setPendingExam(null);

        if (target === "exam") {
            setScreen("start");
            setTimeout(() => {
                const el = document.getElementById("exam-section");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 80);
        } else {
            setScreen(target);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const go = (target) => {
        if (screen === "quiz") {
            setPending(target);
            setLeaveAsk(true);
        } else {
            navigate(target);
        }
    };

    const confirmLeave = () => {
        setLeaveAsk(false);
        setSession(null);
        navigate(pending);
    };

    const logout = () => {
        if (auth) logoutRequest(auth.token);
        clearAuth();
        forgetAdminPage();
        setAuth(null);
        setSession(null);
        setPendingExam(null);
        setScreen("start");
        window.scrollTo({ top: 0 });
    };

    const openRecord = async (id, isModel = false) => {
        try {
            const endpoint = isModel 
                ? "/student/model-attempts/" + id 
                : "/student/attempts/" + id;

            const body = await apiRequest(endpoint, { token });
            const resData = getData(body);

            if (isModel) {
                setRecord(toModelResult({ ...resData.attempt, items: resData.items }, resData.items));
            } else {
                setRecord(toResult(resData));
            }
            setScreen("detail");
            window.scrollTo({ top: 0 });
        } catch (err) {
            if (err.status === 401) forceLogout();
            else window.alert(err.message);
        }
    };

    if (screen === "admin" && auth && isAdminUser(auth.user)) {
        return (
            <AdminPanel
                user={auth.user}
                token={auth.token}
                theme={theme}
                onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
                onLogout={logout}
                onExit={() => setScreen("start")}
                onUserUpdate={updateUser}
            />
        );
    }

    const userName = auth ? auth.user.name : "";

    return (
        <div className="site">
            <Header
                screen={screen}
                onNav={go}
                user={auth && auth.user}
                onLogout={logout}
                theme={theme}
                onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
                site={site}
            />
            <main className="wrap">
                {screen === "start" && (
                    <StartScreen
                        catalog={catalog}
                        user={auth && auth.user}
                        site={site}
                        onStart={handleStart}
                        starting={starting}
                        startError={startError}
                        onLogin={() => go("login")}
                        onRetry={loadCatalog}
                        onPyq={() => go("pyq")}
                        onTopics={openTopics}
                        onCirculars={() => go("circulars")}
                    />
                )}
                {screen === "topics" && (
                    <TopicsScreen initialSubjectId={topicsFocus} onBack={() => go("start")} />
                )}

                {screen === "circulars" && <CircularsScreen onBack={() => go("start")} />}

                {screen === "login" && (
                    <Login
                        onSuccess={handleLogin}
                        onSwitch={site.registration_open ? () => go("register") : undefined}
                        reason={!!pendingExam}
                    />
                )}

                {screen === "model" && (
                    <ModelTestsScreen
                        token={token}
                        user={auth && auth.user}
                        notice={modelNotice}
                        error={modelError}
                        startingId={startingModel}
                        onStart={startModel}
                        onLogin={() => go("login")}
                        onPanel={() => go("panel")}
                        onBack={() => go("start")}
                    />
                )}

                {screen === "panel" && (
                    <>
                        <StudentPanel
                            user={auth && auth.user}
                            token={token}
                            onOpen={(id) => openRecord(id, false)}
                            onStart={() => go("start")}
                            onLogin={() => go("login")}
                            onUnauthorized={forceLogout}
                        />
                        {auth && <ModelHistory token={token} onUnauthorized={forceLogout} onOpenModel={() => go("model")} />}
                    </>
                )}

                {screen === "register" && site.registration_open && (
                    <Register onSuccess={handleLogin} onSwitch={() => go("login")} reason={!!pendingExam} />
                )}
                {screen === "register" && !site.registration_open && (
                    <div className="panel loading-box">
                        <h2>Sign up is closed</h2>
                        <p>New accounts are not being accepted right now.</p>
                        <button className="btn" onClick={() => go("login")}>Go to sign in</button>
                    </div>
                )}

                {screen === "pyq" && (
                    <PyqScreen
                        onBack={() => go("start")}
                        user={currentUser}
                        onLogin={(target) => go(target)}
                    />
                )}

                {screen === "about" && <AboutScreen site={site} onBack={() => go("start")} onContact={() => go("contact")} />}
                {screen === "contact" && <ContactScreen site={site} onBack={() => go("start")} />}
                
                {screen === "quiz" && session && (
                    <QuizScreen
                        questions={session.questions}
                        subjectName={session.subject + " - " + session.name}
                        candidate={userName}
                        timeLimit={session.time}
                        onFinish={handleFinish}
                    />
                )}
                {screen === "result" && result && (
                    <ResultScreen {...result} candidate={userName} onRestart={() => go("start")} />
                )}
               
                {screen === "detail" && record && (
                    <ResultScreen
                        {...record}
                        candidate={userName}
                        onRestart={() => setScreen("panel")}
                        restartLabel="Back to Student Panel"
                    />
                )}
            </main>
            <Footer site={site} />

            {leaveAsk && (
                <div className="overlay">
                    <div className="modal" role="dialog" aria-modal="true">
                        <h3>Leave the exam?</h3>
                        <p>Your exam is still running. If you leave now, your answers will be lost and the exam will end.</p>
                        <div className="row">
                            <button className="btn ghost" onClick={() => setLeaveAsk(false)}>Stay in exam</button>
                            <button className="btn bad" onClick={confirmLeave}>Leave exam</button>
                        </div>
                    </div>
                </div>
            )}

            {submitting && (
                <div className="overlay">
                    <div className="modal" role="status">
                        <h3>Submitting...</h3>
                        <p>Please wait while your answers are checked.</p>
                    </div>
                </div>
            )}

            {submitError && !submitting && (
                <div className="overlay">
                    <div className="modal" role="alertdialog" aria-modal="true">
                        <h3>Could not submit</h3>
                        <p>{submitError}</p>
                        <div className="row">
                            <button
                                className="btn ghost"
                                onClick={() => {
                                    setSubmitError("");
                                    setPendingSubmit(null);
                                    setSession(null);
                                    setScreen("start");
                                }}
                            >
                                Go home
                            </button>
                            {pendingSubmit && (
                                <button className="btn" onClick={() => sendSubmit(pendingSubmit)}>Try again</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;