import { useEffect, useRef, useState } from "react";
import { apiRequest, getData } from "./api";
import { fmtDate } from "../utils/dates";
import "../css/topics.css";
import RichText from "../components/Common/RichText";

const EMPTY = {
    subject_id: "",
    exam_name: "",
    exam_date: "",
    q_no: "",
    question: "",
    answer: "",
    solution: "",
    topics: "",
    images: [""],
    video_url: "",
    sort_order: "",
    active: true,
};

const MAX_IMAGES = 6;

const splitTopics = (s) =>
    String(s || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

// "5" -> "6", anything else -> ""
const nextNo = (n) => (/^\d+$/.test(String(n || "")) ? String(Number(n) + 1) : "");

const rowToForm = (r) => ({
    subject_id: r.subject_id ? String(r.subject_id) : "",
    exam_name: r.exam_name || "",
    exam_date: r.exam_date || "",
    q_no: r.q_no || "",
    question: r.question || "",
    answer: r.answer || "",
    solution: r.solution || "",
    topics: Array.isArray(r.topics) ? r.topics.join(", ") : "",
    images: Array.isArray(r.images) && r.images.length ? [...r.images] : [""],
    video_url: r.video_url || "",
    sort_order: r.sort_order === null || r.sort_order === undefined ? "" : String(r.sort_order),
    active: !!r.active,
});

const bodyOf = (f) => ({
    subject_id: f.subject_id ? Number(f.subject_id) : null,
    exam_name: f.exam_name.trim(),
    exam_date: f.exam_date || null,
    q_no: f.q_no.trim() || null,
    question: f.question.trim(),
    answer: f.answer.trim() || null,
    solution: f.solution.trim() || null,
    topics: splitTopics(f.topics),
    images: f.images.map((u) => u.trim()).filter(Boolean),
    video_url: f.video_url.trim() || null,
    sort_order: f.sort_order === "" || f.sort_order === null ? null : Number(f.sort_order),
    active: !!f.active,
});

function PyqAdmin({ token, onUnauthorized }) {
    const [state, setState] = useState({ loading: true, error: "", rows: [], last: 1, total: 0, exams: [], subjects: [] });
    const [page, setPage] = useState(1);
    const [subjectFilter, setSubjectFilter] = useState("");
    const [examFilter, setExamFilter] = useState("");
    const [q, setQ] = useState("");
    const [appliedQ, setAppliedQ] = useState("");

    const [form, setForm] = useState(null);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErr, setFieldErr] = useState({});
    const [note, setNote] = useState(null);

    const areaRef = useRef(null);
    const overlayRef = useRef(null);

    const unauthorized = (err) => {
        if (err.status === 401) {
            onUnauthorized();
            return true;
        }
        return false;
    };

    const load = async () => {
        try {
            let url = "/pyq-solutions?page=" + page + "&q=" + encodeURIComponent(appliedQ);
            if (subjectFilter) url += "&subject_id=" + subjectFilter;
            if (examFilter) url += "&exam=" + encodeURIComponent(examFilter);
            const d = getData(await apiRequest(url, { token })) || {};
            setState({
                loading: false,
                error: "",
                rows: d.items || [],
                last: d.last_page || 1,
                total: d.total || 0,
                exams: d.exams || [],
                subjects: d.subjects || [],
            });
        } catch (err) {
            if (unauthorized(err)) return;
            setState((s) => ({ ...s, loading: false, error: err.message }));
        }
    };

    useEffect(() => {
        load();
    }, [page, subjectFilter, examFilter, appliedQ]);

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const setImage = (i, value) => setForm((f) => ({ ...f, images: f.images.map((u, k) => (k === i ? value : u)) }));
    const addImage = () => setForm((f) => (f.images.length < MAX_IMAGES ? { ...f, images: [...f.images, ""] } : f));
    const removeImage = (i) =>
        setForm((f) => {
            const next = f.images.filter((_, k) => k !== i);
            return { ...f, images: next.length ? next : [""] };
        });

    const openAdd = () => {
        setEditId(null);
        setFormError("");
        setFieldErr({});
        setForm({ ...EMPTY, images: [""], exam_name: examFilter || "", subject_id: subjectFilter || "" });
    };

    const openEdit = (r) => {
        setEditId(r.id);
        setFormError("");
        setFieldErr({});
        setForm(rowToForm(r));
    };

    // wrap the selected part of the solution, e.g. ==text==
    const mark = (open, close) => {
        const el = areaRef.current;
        if (!el) return;
        const s = el.selectionStart;
        const e = el.selectionEnd;
        if (s === e) {
            setFormError("Select some text in the solution first, then click the button.");
            return;
        }
        setFormError("");
        const v = form.solution;
        set("solution", v.slice(0, s) + open + v.slice(s, e) + close + v.slice(e));
        window.requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(s + open.length, e + open.length);
        });
    };

    // remove the marks from the selected part
    const unmark = () => {
        const el = areaRef.current;
        if (!el) return;
        const s = el.selectionStart;
        const e = el.selectionEnd;
        if (s === e) {
            setFormError("Select some text first to remove its highlight or bold.");
            return;
        }
        setFormError("");
        const v = form.solution;
        const clean = v.slice(s, e).replace(/==|\*\*/g, "");
        set("solution", v.slice(0, s) + clean + v.slice(e));
        window.requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(s, s + clean.length);
        });
    };

    const save = async (addNext) => {
        if (!form.exam_name.trim()) {
            setFormError("The exam name is required.");
            return;
        }
        if (!form.question.trim()) {
            setFormError("The question is required.");
            return;
        }
        if (splitTopics(form.topics).length > 10) {
            setFormError("Use at most 10 topics.");
            return;
        }

        setSaving(true);
        setFormError("");
        setFieldErr({});
        try {
            await apiRequest(editId ? "/pyq-solutions/" + editId : "/pyq-solutions", {
                method: editId ? "PUT" : "POST",
                token,
                body: bodyOf(form),
            });

           if (addNext && !editId) {
    setForm({
        ...EMPTY,
        images: [""],

        // আগের Exam Name ডিফল্ট থাকবে
        exam_name: form.exam_name,

        // আগের Exam Date ডিফল্ট থাকবে
        exam_date: form.exam_date,

        // আগের Subject ডিফল্ট থাকবে
        subject_id: form.subject_id,

        // আগের Question No. থেকে পরবর্তী নম্বর হবে
        q_no: nextNo(form.q_no),
    });

    setNote({
        type: "ok",
        text: "Saved. Now add the next question for this exam.",
    });

    if (overlayRef.current) {
        overlayRef.current.scrollTop = 0;
    }
} else {
    setForm(null);
    setNote({
        type: "ok",
        text: editId ? "Solution updated." : "Solution added.",
    });
}
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setFieldErr(err.errors || {});
            setFormError(err.message);
        }
        setSaving(false);
    };

    const toggle = async (r) => {
        try {
            await apiRequest("/pyq-solutions/" + r.id, {
                method: "PUT",
                token,
                body: bodyOf({ ...rowToForm(r), active: !r.active }),
            });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    const remove = async (r) => {
        if (!window.confirm("Delete this solution?")) return;
        try {
            await apiRequest("/pyq-solutions/" + r.id, { method: "DELETE", token });
            setNote({ type: "ok", text: "Solution deleted." });
            if (state.rows.length === 1 && page > 1) setPage(page - 1);
            else load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    const search = (e) => {
        e.preventDefault();
        setPage(1);
        setAppliedQ(q.trim());
    };

    const firstError = (key) => (fieldErr[key] && fieldErr[key][0] ? fieldErr[key][0] : "");

    return (
        <>
            <div className="adm-top">
                <div>
                    <h2>PYQ solutions</h2>
                    <p>Previous year questions with solutions, highlighted topics, reference images and video tutorials.</p>
                </div>
                <button type="button" className="btn" onClick={openAdd}>＋ Add solution</button>
            </div>

            {note && <div className={"adm-note " + note.type}>{note.text}</div>}
            {state.error && <div className="adm-note bad">{state.error}</div>}

            <div className="adm-card">
                <form className="tp-bar" onSubmit={search}>
                    <select
                        className="tp-select"
                        value={subjectFilter}
                        onChange={(e) => {
                            setPage(1);
                            setSubjectFilter(e.target.value);
                        }}
                    >
                        <option value="">All subjects</option>
                        {state.subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                        ))}
                    </select>

                    <select
                        className="tp-select"
                        value={examFilter}
                        onChange={(e) => {
                            setPage(1);
                            setExamFilter(e.target.value);
                        }}
                    >
                        <option value="">All exams</option>
                        {state.exams.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>

                    <input className="tp-input" style={{ width: 220 }} placeholder="Search question or exam" value={q} onChange={(e) => setQ(e.target.value)} />
                    <button type="submit" className="btn ghost sm">Search</button>
                    <span className="adm-muted">{state.total} solution(s)</span>
                </form>

                {state.loading ? (
                    <p className="adm-muted">Loading...</p>
                ) : state.rows.length === 0 ? (
                    <p className="adm-muted">No solution found. Click "Add solution" to create one.</p>
                ) : (
                    <div className="adm-tbl-wrap">
                        <table className="adm-tbl">
                            <thead>
                                <tr>
                                    <th>Exam</th>
                                    <th>Q</th>
                                    <th>Question</th>
                                    <th>Subject</th>
                                    <th>Has</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.rows.map((r) => {
                                    const imgs = Array.isArray(r.images) ? r.images.length : 0;
                                    return (
                                        <tr key={r.id}>
                                            <td>
                                                <b>{r.exam_name}</b>
                                                <br />
                                                <small className="adm-muted">{r.exam_date ? fmtDate(r.exam_date) : "no date"}</small>
                                            </td>
                                            <td>{r.q_no || "-"}</td>
                                            <td><div className="tp-clip">{r.question}</div></td>
                                            <td>{r.subject ? r.subject.icon + " " + r.subject.name : "-"}</td>
                                            <td>
                                                {r.solution ? "📝 " : ""}
                                                {imgs > 0 ? "🖼" + imgs + " " : ""}
                                                {r.video_url ? "🎥" : ""}
                                                {!r.solution && imgs === 0 && !r.video_url ? "-" : ""}
                                            </td>
                                            <td>
                                                <span className={"badge " + (r.active ? "pass" : "gray")}>{r.active ? "Shown" : "Hidden"}</span>
                                            </td>
                                            <td>
                                                <div className="tp-actions">
                                                    <button type="button" className="btn ghost sm" onClick={() => toggle(r)}>{r.active ? "Hide" : "Show"}</button>
                                                    <button type="button" className="btn ghost sm" onClick={() => openEdit(r)}>Edit</button>
                                                    <button type="button" className="btn bad sm" onClick={() => remove(r)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {state.last > 1 && (
                    <div className="tp-bar" style={{ marginTop: 14, justifyContent: "flex-end" }}>
                        <button type="button" className="btn ghost sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
                        <span className="adm-muted">Page {page} of {state.last}</span>
                        <button type="button" className="btn ghost sm" disabled={page >= state.last} onClick={() => setPage(page + 1)}>Next →</button>
                    </div>
                )}
            </div>

            {form && (
                <div className="tp-overlay" ref={overlayRef}>
                    <div className="tp-modal wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        {/* X Icon added here */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>{editId ? "Edit solution" : "Add solution"}</h3>
                            <button 
                                type="button" 
                                onClick={() => !saving && setForm(null)} 
                                style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--muted)", padding: "0 5px" }}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {formError && <div className="adm-note bad">{formError}</div>}

                        <div className="tp-row2">
                            <label className="tp-field">
                                <span>Exam name *</span>
                                <input
                                    className="tp-input"
                                    list="pyq-exams"
                                    value={form.exam_name}
                                    maxLength={150}
                                    onChange={(e) => set("exam_name", e.target.value)}
                                    placeholder="e.g. 45th BCS Preliminary"
                                />
                                <datalist id="pyq-exams">
                                    {state.exams.map((n) => (
                                        <option key={n} value={n} />
                                    ))}
                                </datalist>
                                {firstError("exam_name") && <small className="tp-err">{firstError("exam_name")}</small>}
                            </label>
                            <label className="tp-field">
                                <span>Exam date</span>
                                <input className="tp-input" type="date" value={form.exam_date} onChange={(e) => set("exam_date", e.target.value)} />
                                {firstError("exam_date") && <small className="tp-err">{firstError("exam_date")}</small>}
                            </label>
                        </div>

                        <div className="tp-row2">
                            <label className="tp-field">
                                <span>Subject (optional)</span>
                                <select className="tp-select" value={form.subject_id} onChange={(e) => set("subject_id", e.target.value)}>
                                    <option value="">No subject</option>
                                    {state.subjects.map((s) => (
                                        <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="tp-field">
                                <span>Question no. (optional)</span>
                                <input className="tp-input" value={form.q_no} maxLength={20} onChange={(e) => set("q_no", e.target.value)} placeholder="e.g. 12" />
                            </label>
                        </div>

                        <label className="tp-field">
                            <span>Question * ({form.question.length}/5000)</span>
                            <textarea className="tp-area" value={form.question} maxLength={5000} onChange={(e) => set("question", e.target.value)} />
                            {firstError("question") && <small className="tp-err">{firstError("question")}</small>}
                        </label>

                        <label className="tp-field">
                            <span>Short answer (optional)</span>
                            <input className="tp-input" value={form.answer} maxLength={500} onChange={(e) => set("answer", e.target.value)} placeholder="e.g. 42" />
                        </label>

                        <div className="tp-field">
                            <span>Solution ({form.solution.length}/10000)</span>
                            <div className="tp-tools">
                                <button type="button" className="btn ghost sm" onMouseDown={(e) => e.preventDefault()} onClick={() => mark("==", "==")}>🖍 Highlight</button>
                                <button type="button" className="btn ghost sm" onMouseDown={(e) => e.preventDefault()} onClick={() => mark("**", "**")}><b>B</b> Bold</button>
                                <button type="button" className="btn ghost sm" onMouseDown={(e) => e.preventDefault()} onClick={unmark}>✖ Clear marks</button>
                                <small className="adm-muted">Select text, then click a button.</small>
                            </div>
                            <textarea
                                ref={areaRef}
                                className="tp-area tall"
                                value={form.solution}
                                maxLength={10000}
                                onChange={(e) => set("solution", e.target.value)}
                                placeholder="Write the solution. Select an important word or line and click Highlight."
                            />
                            {firstError("solution") && <small className="tp-err">{firstError("solution")}</small>}

                            {form.solution.trim() && (
                                <div className="tp-prev">
                                    <small className="adm-muted">Preview (how students see it)</small>
                                    <RichText text={form.solution} />
                                </div>
                            )}
                        </div>

                        <label className="tp-field">
                            <span>Topics (separate with a comma, max 10)</span>
                            <input className="tp-input" value={form.topics} onChange={(e) => set("topics", e.target.value)} placeholder="e.g. Number System, Percentage" />
                            {splitTopics(form.topics).length > 0 && (
                                <div className="tp-chips">
                                    {splitTopics(form.topics).map((t) => (
                                        <span key={t} className="tp-chip">{t}</span>
                                    ))}
                                </div>
                            )}
                            {firstError("topics") && <small className="tp-err">{firstError("topics")}</small>}
                        </label>

                        <div className="tp-field">
                            <span>Reference images (links that start with https://, max {MAX_IMAGES})</span>
                            {form.images.map((url, i) => (
                                <div className="tp-imgrow" key={i}>
                                    <input className="tp-input" value={url} onChange={(e) => setImage(i, e.target.value)} placeholder="https://..." />
                                    {/^https?:\/\//i.test(url.trim()) && (
                                        <img
                                            src={url.trim()}
                                            alt=""
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                e.currentTarget.style.visibility = "hidden";
                                            }}
                                        />
                                    )}
                                    <button type="button" className="btn ghost sm" onClick={() => removeImage(i)} aria-label="Remove image">✕</button>
                                </div>
                            ))}
                            {form.images.length < MAX_IMAGES && (
                                <button type="button" className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={addImage}>＋ Add image</button>
                            )}
                            {(firstError("images") || Object.keys(fieldErr).some((k) => k.indexOf("images.") === 0)) && (
                                <small className="tp-err">One of the image links is not valid. It must start with http:// or https://</small>
                            )}
                        </div>

                        <label className="tp-field">
                            <span>Video tutorial URL (optional)</span>
                            <input className="tp-input" value={form.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                            {firstError("video_url") && <small className="tp-err">{firstError("video_url")}</small>}
                        </label>

                        <div className="tp-row2">
                            <label className="tp-field">
                                <span>Order (optional)</span>
                                <input className="tp-input" type="number" min="0" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
                            </label>
                            <label className="tp-check">
                                <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
                                <span>Show on website</span>
                            </label>
                        </div>

                        <div className="tp-foot" style={{ flexWrap: "wrap" }}>
                            <button type="button" className="btn ghost" disabled={saving} onClick={() => setForm(null)}>Cancel</button>
                            {!editId && (
                                <button type="button" className="btn ghost" disabled={saving} onClick={() => save(true)}>Save & add next</button>
                            )}
                            <button type="button" className="btn" disabled={saving} onClick={() => save(false)}>{saving ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default PyqAdmin;