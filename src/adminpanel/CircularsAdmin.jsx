import { useEffect, useState } from "react";
import { apiRequest, getData } from "./api";
import { fmtDate, todayStr } from "../utils/dates";
import "../css/topics.css";

const EMPTY = {
    category: "Govt Job Circulars",
    organization: "",
    designation: "",
    start_date: "",
    end_date: "",
    link_url: "",
    apply_url: "",
    active: true,
};

function CircularsAdmin({ token, onUnauthorized }) {
    const [state, setState] = useState({ loading: true, error: "", rows: [], page: 1, last: 1, total: 0, cats: [] });
    const [page, setPage] = useState(1);
    const [catFilter, setCatFilter] = useState("");
    const [q, setQ] = useState("");
    const [appliedQ, setAppliedQ] = useState("");

    const [form, setForm] = useState(null);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErr, setFieldErr] = useState({});
    const [note, setNote] = useState(null);

    const unauthorized = (err) => {
        if (err.status === 401) {
            onUnauthorized();
            return true;
        }
        return false;
    };

    const load = async () => {
        setState((s) => ({ ...s, loading: true, error: "" }));
        try {
            let url = "/circulars?page=" + page + "&q=" + encodeURIComponent(appliedQ);
            if (catFilter) url += "&category=" + encodeURIComponent(catFilter);
            const d = getData(await apiRequest(url, { token })) || {};
            setState({
                loading: false,
                error: "",
                rows: d.circulars || [],
                page: d.page || 1,
                last: d.last_page || 1,
                total: d.total || 0,
                cats: d.categories || [],
            });
        } catch (err) {
            if (unauthorized(err)) return;
            setState((s) => ({ ...s, loading: false, error: err.message }));
        }
    };

    useEffect(() => {
        load();
    }, [page, catFilter, appliedQ]);

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const openAdd = () => {
        setEditId(null);
        setFormError("");
        setFieldErr({});
        setForm({ ...EMPTY, category: catFilter || EMPTY.category });
    };

    const openEdit = (c) => {
        setEditId(c.id);
        setFormError("");
        setFieldErr({});
        setForm({
            category: c.category || "",
            organization: c.organization || "",
            designation: c.designation || "",
            start_date: c.start_date || "",
            end_date: c.end_date || "",
            link_url: c.link_url || "",
            apply_url: c.apply_url || "",
            active: !!c.active,
        });
    };

    const bodyOf = (f) => ({
        category: f.category.trim(),
        organization: f.organization.trim(),
        designation: f.designation.trim() || null,
        start_date: f.start_date || null,
        end_date: f.end_date || null,
        link_url: f.link_url.trim() || null,
        apply_url: f.apply_url.trim() || null,
        active: !!f.active,
    });

    const save = async () => {
        if (!form.category.trim()) {
            setFormError("The category is required.");
            return;
        }
        if (!form.organization.trim()) {
            setFormError("The organization name is required.");
            return;
        }
        if (form.start_date && form.end_date && form.end_date < form.start_date) {
            setFormError("The end date cannot be before the start date.");
            return;
        }

        setSaving(true);
        setFormError("");
        setFieldErr({});
        try {
            await apiRequest(editId ? "/circulars/" + editId : "/circulars", {
                method: editId ? "PUT" : "POST",
                token,
                body: bodyOf(form),
            });
            setForm(null);
            setNote({ type: "ok", text: editId ? "Circular updated." : "Circular added." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setFieldErr(err.errors || {});
            setFormError(err.message);
        }
        setSaving(false);
    };

    const toggle = async (c) => {
        try {
            await apiRequest("/circulars/" + c.id, {
                method: "PUT",
                token,
                body: bodyOf({
                    category: c.category,
                    organization: c.organization,
                    designation: c.designation || "",
                    start_date: c.start_date || "",
                    end_date: c.end_date || "",
                    link_url: c.link_url || "",
                    apply_url: c.apply_url || "",
                    active: !c.active,
                }),
            });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    const remove = async (c) => {
        if (!window.confirm('Delete the circular of "' + c.organization + '"?')) return;
        try {
            await apiRequest("/circulars/" + c.id, { method: "DELETE", token });
            setNote({ type: "ok", text: "Circular deleted." });
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
    const today = todayStr();

    return (
        <>
            <div className="adm-top">
                <div>
                    <h2>Job circulars</h2>
                    <p>Add job circulars. They appear on the Jobs page, grouped into tabs by category.</p>
                </div>
                <button type="button" className="btn" onClick={openAdd}>＋ Add circular</button>
            </div>

            {note && <div className={"adm-note " + note.type}>{note.text}</div>}
            {state.error && <div className="adm-note bad">{state.error}</div>}

            <div className="adm-card">
                <form className="tp-bar" onSubmit={search}>
                    <select
                        className="tp-select"
                        value={catFilter}
                        onChange={(e) => {
                            setPage(1);
                            setCatFilter(e.target.value);
                        }}
                    >
                        <option value="">All categories</option>
                        {state.cats.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <input className="tp-input" style={{ width: 240 }} placeholder="Search organization or post" value={q} onChange={(e) => setQ(e.target.value)} />
                    <button type="submit" className="btn ghost sm">Search</button>
                    <span className="adm-muted">{state.total} circular(s)</span>
                </form>

                {state.loading ? (
                    <p className="adm-muted">Loading...</p>
                ) : state.rows.length === 0 ? (
                    <p className="adm-muted">No circular found. Click "Add circular" to create one.</p>
                ) : (
                    <div className="adm-tbl-wrap">
                        <table className="adm-tbl">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Organization</th>
                                    <th>Designation</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.rows.map((c) => {
                                    const closed = c.end_date && c.end_date < today;
                                    return (
                                        <tr key={c.id}>
                                            <td>{c.category}</td>
                                            <td><b>{c.organization}</b></td>
                                            <td><div className="tp-clip">{c.designation || "-"}</div></td>
                                            <td>{fmtDate(c.start_date)}</td>
                                            <td>{fmtDate(c.end_date)}</td>
                                            <td>
                                                <span className={"badge " + (c.active ? "pass" : "gray")}>{c.active ? "Shown" : "Hidden"}</span>{" "}
                                                {closed && <span className="badge gray">Closed</span>}
                                            </td>
                                            <td>
                                                <div className="tp-actions">
                                                    <button type="button" className="btn ghost sm" onClick={() => toggle(c)}>{c.active ? "Hide" : "Show"}</button>
                                                    <button type="button" className="btn ghost sm" onClick={() => openEdit(c)}>Edit</button>
                                                    <button type="button" className="btn bad sm" onClick={() => remove(c)}>Delete</button>
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
                        <span className="adm-muted">Page {state.page} of {state.last}</span>
                        <button type="button" className="btn ghost sm" disabled={page >= state.last} onClick={() => setPage(page + 1)}>Next →</button>
                    </div>
                )}
            </div>

            {form && (
                <div className="tp-overlay" onClick={() => !saving && setForm(null)}>
                    <div className="tp-modal wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h3>{editId ? "Edit circular" : "Add circular"}</h3>

                        {formError && <div className="adm-note bad">{formError}</div>}

                        <label className="tp-field">
                            <span>Category (tab) *</span>
                            <input
                                className="tp-input"
                                list="circular-cats"
                                value={form.category}
                                maxLength={80}
                                onChange={(e) => set("category", e.target.value)}
                                placeholder="Choose or type a new category"
                            />
                            <datalist id="circular-cats">
                                {state.cats.map((c) => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                            {firstError("category") && <small className="tp-err">{firstError("category")}</small>}
                        </label>

                        <label className="tp-field">
                            <span>Organization *</span>
                            <input className="tp-input" value={form.organization} maxLength={200} onChange={(e) => set("organization", e.target.value)} placeholder="e.g. Bangladesh Computer Council" />
                            {firstError("organization") && <small className="tp-err">{firstError("organization")}</small>}
                        </label>

                        <label className="tp-field">
                            <span>Designation (post and vacancy)</span>
                            <input className="tp-input" value={form.designation} maxLength={300} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Assistant Programmer-01, AME-01" />
                        </label>

                        <div className="tp-row2">
                            <label className="tp-field">
                                <span>Start date</span>
                                <input className="tp-input" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
                                {firstError("start_date") && <small className="tp-err">{firstError("start_date")}</small>}
                            </label>
                            <label className="tp-field">
                                <span>End date</span>
                                <input className="tp-input" type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
                                {firstError("end_date") && <small className="tp-err">{firstError("end_date")}</small>}
                            </label>
                        </div>

                        <label className="tp-field">
                            <span>Circular link (notice or organization page)</span>
                            <input className="tp-input" value={form.link_url} onChange={(e) => set("link_url", e.target.value)} placeholder="https://..." />
                            {firstError("link_url") && <small className="tp-err">{firstError("link_url")}</small>}
                        </label>

                        <label className="tp-field">
                            <span>Apply link (used by the "Apply Now" button)</span>
                            <input className="tp-input" value={form.apply_url} onChange={(e) => set("apply_url", e.target.value)} placeholder="https://..." />
                            {firstError("apply_url") && <small className="tp-err">{firstError("apply_url")}</small>}
                        </label>

                        <label className="tp-check">
                            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
                            <span>Show on website</span>
                        </label>

                        <div className="tp-foot">
                            <button type="button" className="btn ghost" disabled={saving} onClick={() => setForm(null)}>Cancel</button>
                            <button type="button" className="btn" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CircularsAdmin;