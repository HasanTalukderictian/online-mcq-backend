import { useState } from "react";
import Hero from "./Hero";
import SubjectShowcase from "./SubjectShowcase";
import Features from "./Features";
import { fmtTime } from "../adminpanel/ui";
import NoticeBar from "./NoticeBar";

// =============================
// WhatsApp config (function er baire)
// =============================
const WA_NUMBER = "8801768712230";
const WA_TEXT = "আসসালামু আলাইকুম, আমি Online MCQ Test সম্পর্কে জানতে চাই।";
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_TEXT)}`;
const WA_COMMUNITY_LINK = "https://chat.whatsapp.com/DW3mbvP4Pvl3e6g4h1KU6N";

const WhatsAppIcon = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

function StartScreen({ catalog, user, site, onStart, starting, startError, onLogin, onRetry, onTopics, onCirculars }) {
    const [subjectId, setSubjectId] = useState(null);
    const [examId, setExamId] = useState(null);

    const list = catalog.subjects;
    const subj = list.find((s) => String(s.id) === String(subjectId)) || list[0];
    const exams = subj ? subj.exams : [];
    const exam =
        exams.find((e) => String(e.id) === String(examId)) ||
        exams.find((e) => !e.completed) ||
        exams[0];

    const isMobile = typeof window !== "undefined" && window.innerWidth <= 720;
    const isTablet = typeof window !== "undefined" && window.innerWidth <= 992;

    const subjectsGridStyle = {
        display: "grid",
        gridTemplateColumns: isMobile
            ? "1fr"
            : isTablet
                ? "repeat(2, 1fr)"
                : "repeat(3, 1fr)",
        gap: isMobile ? "10px" : "12px",
        width: "100%",
    };

    const examListStyle = {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: isMobile ? "10px" : "8px",
        width: "100%",
    };

    const subjBtnStyle = {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        maxWidth: "100%",
        minHeight: isMobile ? "56px" : "52px",
        padding: isMobile ? "14px 16px" : "10px 12px",
        fontSize: isMobile ? "14.5px" : "13px",
        textAlign: "left",
        whiteSpace: "normal",
        wordBreak: "break-word",
        overflow: "visible",
        textOverflow: "clip",
        boxSizing: "border-box",
    };

    const examBtnStyle = {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "100%",
        padding: isMobile ? "14px 16px" : "12px 14px",
        boxSizing: "border-box",
        textAlign: "left",
    };

    const pickSubject = (id) => {
        setSubjectId(id);
        setExamId(null);
    };

    const pickFromShowcase = (id) => {
        pickSubject(id);
        const el = document.getElementById("exam-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    let body;
    if (catalog.loading && !list.length) {
        body = <div className="panel loading-box">Loading subjects...</div>;
    } else if (catalog.error) {
        body = (
            <div className="panel loading-box">
                <p>Could not load the exams: {catalog.error}</p>
                <button className="btn" onClick={onRetry}>Try again</button>
            </div>
        );
    } else if (!list.length) {
        body = (
            <div className="panel loading-box">
                <h2>No exams available yet</h2>
                <p>Please check back soon.</p>
            </div>
        );
    } else {
        const taken = !!exam.completed;
        const pass = exam.pass_mark || 60;

        let label = "Start " + exam.name;
        if (!user) label = "Sign up to start";
        else if (taken) label = "Already taken";
        else if (starting) label = "Loading exam...";

        body = (
            <>
                <div className="panel">
                    <h1>Start your exam</h1>
                    <p className="sub">Choose a subject and an exam.</p>

                    {user ? (
                        <div className="acct in">👤 Exam as <b>{user.name}</b></div>
                    ) : (
                        <div className="acct">
                            🔒 Sign up (free) to take an exam. Already registered?{" "}
                            <button type="button" className="link-btn" onClick={onLogin}>Log in</button>
                        </div>
                    )}

                    <div className="pick-scroll">
                        <span className="label" id="subjects-label">Subject</span>

                        <div className="subjects" style={subjectsGridStyle}>
                            {list.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={"subj " + (subj.id === s.id ? "on" : "")}
                                    style={{ "--c": s.color, ...subjBtnStyle }}
                                    onClick={() => pickSubject(s.id)}
                                >
                                    <span style={{ fontSize: isMobile ? "20px" : "18px", flexShrink: 0, marginRight: "6px" }}>
                                        {s.icon}
                                    </span>
                                    {s.name}
                                </button>
                            ))}
                        </div>

                        <span className="label">Exam</span>

                        <div className="exam-list" style={examListStyle}>
                            {exams.map((e) => (
                                <button
                                    key={e.id}
                                    type="button"
                                    className={"exam-opt " + (exam.id === e.id && !e.completed ? "on" : "") + (e.completed ? " done" : "")}
                                    disabled={e.completed}
                                    style={examBtnStyle}
                                    onClick={() => setExamId(e.id)}
                                >
                                    <b>{e.name}</b>
                                    <small>
                                        {e.completed
                                            ? "✓ Completed · " + e.percent + "%"
                                            : e.questions_count + " questions · " + fmtTime(e.time)}
                                    </small>
                                </button>
                            ))}
                        </div>
                    </div>

                    {startError && <div className="err">{startError}</div>}
                    {taken && !startError && <div className="err">You have already taken {exam.name}. Please choose another exam.</div>}
                </div>

                <div className="panel rules">
                    <h2>Instructions</h2>
                    <ul>
                        <li>Each question has one correct answer.</li>
                        <li>Use the question palette to jump to any question.</li>
                        <li>Mark a question for review if you are unsure.</li>
                        <li>The exam submits automatically when time runs out.</li>
                        <li>You need {pass}% to pass.</li>
                    </ul>
                    <div className="facts">
                        <div><b>{exam.questions_count}</b><small>Questions</small></div>
                        <div><b>{fmtTime(exam.time)}</b><small>Duration</small></div>
                        <div><b>{pass}%</b><small>Pass mark</small></div>
                    </div>
                    <button
                        className="btn full"
                        disabled={site.maintenance_mode || (user ? taken || starting : false)}
                        onClick={() => onStart(exam.id)}
                    >
                        {site.maintenance_mode ? "Exams are closed" : label}
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Hero stats={catalog.stats} loading={catalog.loading} site={site} />

            <NoticeBar />

            {site.maintenance_mode && (
                <div className="maint">🛠 {site.maintenance_message || "Exams are closed for now."}</div>
            )}

            {/* Payment Info Section */}
            <PaymentSection />

            {/* Explore subjects Section with 3 columns */}
            <SubjectShowcase
                subjects={list}
                loading={catalog.loading}
                error={catalog.error}
                stats={catalog.stats}
                onPick={pickFromShowcase}
            />

            {/* Start your exam */}
            <div className="start mt-5" id="exam-section">{body}</div>

            {/* Why choose */}
            <Features />

            {/* WhatsApp floating icon (always visible, content er dan edge e) */}
            <WhatsAppFloat />
        </>
    );
}

// =============================
// Payment Section + WhatsApp Community
// =============================
function PaymentSection() {
    const paymentMethods = [
        {
            name: "bKash",
            number: "01768712230",
            color: "#E2136E",
            logoSvg: (
                <svg viewBox="0 0 60 60" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                    <rect width="60" height="60" rx="12" fill="#E2136E" />
                    <text x="30" y="40" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="bold" fill="#fff" textAnchor="middle">b</text>
                </svg>
            ),
        },
        {
            name: "Rocket",
            number: "018204163400",
            color: "#8C3494",
            logoSvg: (
                <svg viewBox="0 0 60 60" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                    <rect width="60" height="60" rx="12" fill="#8C3494" />
                    <text x="30" y="40" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="bold" fill="#fff" textAnchor="middle">R</text>
                </svg>
            ),
        },
        {
            name: "Nagad",
            number: "01637712713",
            color: "#F58220",
            logoSvg: (
                <svg viewBox="0 0 60 60" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                    <rect width="60" height="60" rx="12" fill="#F58220" />
                    <text x="30" y="40" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="bold" fill="#fff" textAnchor="middle">N</text>
                </svg>
            ),
        },
    ];

    return (
        <div className="pay-wrap" id="payment-section">
            <style>{`
                .pay-wrap{
                    width:100%;
                    max-width:1035px;
                    margin:32px auto;
                    padding:32px 24px;
                    background:var(--card, #ffffff);
                    border:1px solid var(--line, #eef0f4);
                    border-radius:16px;
                    box-shadow:0 4px 20px rgba(0,0,0,.06);
                    box-sizing:border-box;
                }
                .pay-head{ text-align:center; margin-bottom:28px; }
                .pay-title{
                    font-size:26px; font-weight:700; margin:0 0 10px;
                    color:var(--ink, #1f2937);
                }
                .pay-sub{
                    font-size:15px; line-height:1.6; margin:0 0 4px;
                    color:var(--muted, #6b7280);
                }
                .pay-sub.small{ font-size:13px; }

                .pay-grid{
                    display:grid;
                    grid-template-columns:repeat(3, minmax(0, 1fr));
                    gap:12px;
                    width:100%;
                }
                .pay-card{
                    display:flex; align-items:center; gap:14px;
                    padding:20px 22px;
                    border-radius:12px;
                    box-sizing:border-box; min-width:0;
                    background:color-mix(in srgb, var(--pc) 10%, var(--card, #ffffff));
                    border:1px solid color-mix(in srgb, var(--pc) 28%, transparent);
                }
                .pay-logo{ flex-shrink:0; display:flex; }
                .pay-info{ display:flex; flex-direction:column; min-width:0; flex:1; }
                .pay-name{
                    font-size:13px; font-weight:700; letter-spacing:.3px;
                    text-transform:uppercase; color:var(--pc);
                }
                .pay-number{
                    font-size:18px; font-weight:700; margin-top:2px;
                    font-family:monospace;
                    color:var(--ink, #1f2937);
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                }
                .pay-type{
                    font-size:11px; margin-top:4px;
                    color:var(--muted, #6b7280);
                }

                .pay-note{
                    margin-top:24px;
                    padding:14px 18px;
                    border-radius:8px;
                    border-left:4px solid #F59E0B;
                    background:color-mix(in srgb, #F59E0B 16%, var(--card, #ffffff));
                    color:var(--ink, #78350F);
                    font-size:14px; line-height:1.6; text-align:center;
                }

                /* WhatsApp Community Section Styles */
                .wa-community-box {
                    margin-top: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 20px;
                    border-radius: 12px;
                    background: color-mix(in srgb, #25D366 8%, var(--card, #ffffff));
                    border: 1px dashed #25D366;
                    text-align: center;
                }
                .wa-community-box p {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 500;
                    color: var(--ink, #1f2937);
                }
                .wa-join-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #25D366;
                    color: #fff;
                    padding: 10px 20px;
                    border-radius: 999px;
                    font-size: 15px;
                    font-weight: 700;
                    text-decoration: none;
                    transition: transform .2s ease, box-shadow .2s ease;
                    box-shadow: 0 4px 12px rgba(37,211,102,.3);
                }
                .wa-join-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(37,211,102,.45);
                }

                @media (max-width:720px){
                    .pay-wrap{ padding:24px 16px; }
                    .pay-title{ font-size:20px; }
                    .pay-sub{ font-size:13px; }
                    .pay-sub.small{ font-size:12px; }
                    .pay-grid{ grid-template-columns:1fr; }
                    .pay-number{ font-size:16px; }
                    .pay-note{ font-size:12px; }
                    .wa-community-box p { font-size: 14px; }
                }
            `}</style>

            <div className="pay-head">
                <h2 className="pay-title">Payment Information</h2>
                <p className="pay-sub">
                    আমাদের এই ভালো উদ্যোগকে এগিয়ে নিতে এবং আরও মানুষের উপকারে আসতে
                    <br />
                    আপনি চাইলে আমাদের ডোনেট করে সহযোগিতা করতে পারেন
                </p>
                <p className="pay-sub small">Send Money করতে পারেন</p>
            </div>

            <div className="pay-grid">
                {paymentMethods.map((m) => (
                    <div className="pay-card" key={m.name} style={{ "--pc": m.color }}>
                        <div className="pay-logo">{m.logoSvg}</div>
                        <div className="pay-info">
                            <span className="pay-name">{m.name}</span>
                            <span className="pay-number">{m.number}</span>
                            <span className="pay-type">Send Money (Personal)</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pay-note">
                <strong>আপনার সামান্য সহযোগিতাও আমাদের জন্য অনেক বড় অনুপ্রেরণা।</strong>
            </div>

            {/* ===== WhatsApp Community Join Section ===== */}
            <div className="wa-community-box">
                <p>আমাদের WhatsApp Community-তে যুক্ত হতে চাইলে লিংকে ক্লিক করুন</p>
                <a href={WA_COMMUNITY_LINK} target="_blank" rel="noopener noreferrer" className="wa-join-btn">
                    <WhatsAppIcon size={20} />
                    Join Community
                </a>
            </div>
        </div>
    );
}

// =============================
// WhatsApp Floating Icon
// Always visible, content er dan edge e align kora
// =============================
function WhatsAppFloat() {
    return (
        <>
            <style>{`
                .wa-float{
                    /* 1144px = tomar section content er width (Hero/Notice er moto) */
                    --wa-content-w: 1144px;

                    position:fixed;
                    bottom:20px;
                    /* content er dan edge er sathe mile thakbe; choto screen e kone theke 14px */
                    right:max(14px, calc((100vw - var(--wa-content-w)) / 2 + 6px));
                    z-index:90;

                    width:56px; height:56px; border-radius:50%;
                    display:grid; place-items:center;
                    background:#25D366; color:#fff; text-decoration:none;
                    box-shadow:0 6px 20px rgba(37,211,102,.45);
                    transition:transform .2s ease, box-shadow .2s ease;
                }
                .wa-float:hover{ transform:scale(1.08); box-shadow:0 8px 26px rgba(37,211,102,.6); }
                .wa-float::after{
                    content:""; position:absolute; inset:0; border-radius:50%;
                    border:2px solid #25D366; animation:waPulse 2s ease-out infinite;
                }
                @keyframes waPulse{ 0%{transform:scale(1);opacity:.7} 100%{transform:scale(1.5);opacity:0} }
                @media (max-width:720px){
                    .wa-float{ bottom:14px; right:14px; width:52px; height:52px; }
                }
                @media (prefers-reduced-motion: reduce){
                    .wa-float::after{ animation:none; display:none; }
                }
            `}</style>
            <a
                className="wa-float"
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp e message korun"
                title="WhatsApp e message korun"
            >
                <WhatsAppIcon />
            </a>
        </>
    );
}

export default StartScreen;