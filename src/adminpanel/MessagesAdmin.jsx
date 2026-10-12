import { useEffect, useState } from "react";
import { apiRequest, getData } from "./api";
import "../css/topics.css";

const when = (s) => {
    if (!s) return "-";
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const phoneHref = (p) => "tel:" + String(p || "").replace(/[^\d+]/g, "");

function MessagesAdmin({ token, onUnauthorized, onUnreadChange }) {
    const [state, setState] = useState({ loading: true, error: "", rows: [], last: 1, total: 0, unread: 0 });
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [q, setQ] = useState("");
    const [appliedQ, setAppliedQ] = useState("");
    const [open, setOpen] = useState(null);
    const [note, setNote] = useState(null);

    const unauthorized = (err) => {
        if (err.status === 401) {
            onUnauthorized();
            return true;
        }
        return false;
    };

    const load = async () => {
        try {
            let url = "/contact-messages?page=" + page + "&q=" + encodeURIComponent(appliedQ);
            if (status) url += "&status=" + status;
            const d = getData(await apiRequest(url, { token })) || {};
            setState({
                loading: false,
                error: "",
                rows: d.messages || [],
                last: d.last_page || 1,
                total: d.total || 0,
                unread: d.unread || 0,
            });
            if (onUnreadChange) onUnreadChange(d.unread || 0);
        } catch (err) {
            if (unauthorized(err)) return;
            setState((s) => ({ ...s, loading: false, error: err.message }));
        }
    };

    useEffect(() => {
        load();
    }, [page, status, appliedQ]);

    const mark = async (m, isRead) => {
        try {
            await apiRequest("/contact-messages/" + m.id, { method: "PUT", token, body: { is_read: isRead } });
            setOpen((o) => (o && o.id === m.id ? { ...o, is_read: isRead } : o));
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    const view = (m) => {
        setOpen(m);
        if (!m.is_read) mark(m, true);
    };

    const remove = async (m) => {
        if (!window.confirm("Delete this message from " + m.name + "?")) return;
        try {
            await apiRequest("/contact-messages/" + m.id, { method: "DELETE", token });
            setOpen(null);
            setNote({ type: "ok", text: "Message deleted." });
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

    return (
        <>
            <div className="adm-top">
                <div>
                    <h2>Messages</h2>
                    <p>Queries sent from the Contact page. {state.unread > 0 ? state.unread + " unread." : "All read."}</p>
                </div>
            </div>

            {note && <div className={"adm-note " + note.type}>{note.text}</div>}
            {state.error && <div className="adm-note bad">{state.error}</div>}

            <div className="adm-card">
                <form className="tp-bar" onSubmit={search}>
                    <select
                        className="tp-select"
                        value={status}
                        onChange={(e) => {
                            setPage(1);
                            setStatus(e.target.value);
                        }}
                    >
                        <option value="">All messages</option>
                        <option value="new">Unread only</option>
                        <option value="read">Read only</option>
                    </select>
                    <input className="tp-input" style={{ width: 240 }} placeholder="Search name, email or text" value={q} onChange={(e) => setQ(e.target.value)} />
                    <button type="submit" className="btn ghost sm">Search</button>
                    <span className="adm-muted">{state.total} message(s)</span>
                </form>

                {state.loading ? (
                    <p className="adm-muted">Loading...</p>
                ) : state.rows.length === 0 ? (
                    <p className="adm-muted">No message found.</p>
                ) : (
                    <div className="adm-tbl-wrap">
                        <table className="adm-tbl">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>From</th>
                                    <th>Subject / message</th>
                                    <th>Received</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.rows.map((m) => (
                                    <tr key={m.id} style={m.is_read ? undefined : { fontWeight: 700 }}>
                                        <td>{m.is_read ? "" : "🔵"}</td>
                                        <td>
                                            {m.name}
                                            <br />
                                            <small className="adm-muted">{m.email}</small>
                                        </td>
                                        <td>
                                            <div className="tp-clip">{m.subject || m.message}</div>
                                        </td>
                                        <td>{when(m.created_at)}</td>
                                        <td>
                                            <div className="tp-actions">
                                                <button type="button" className="btn sm" onClick={() => view(m)}>View</button>
                                                <button type="button" className="btn bad sm" onClick={() => remove(m)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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

            {open && (
                <div className="tp-overlay" onClick={() => setOpen(null)}>
                    <div className="tp-modal wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h3>{open.subject || "Message from " + open.name}</h3>

                        <p className="adm-muted" style={{ marginTop: -8 }}>
                            <b>{open.name}</b> · <a href={"mailto:" + open.email}>{open.email}</a>
                            {open.phone ? <> · <a href={phoneHref(open.phone)}>{open.phone}</a></> : null}
                            <br />
                            {when(open.created_at)}
                        </p>

                        <div className="tp-msg">{open.message}</div>

                        <div className="tp-foot" style={{ flexWrap: "wrap" }}>
                            <button type="button" className="btn bad" onClick={() => remove(open)}>Delete</button>
                            <button type="button" className="btn ghost" onClick={() => mark(open, !open.is_read)}>
                                {open.is_read ? "Mark as unread" : "Mark as read"}
                            </button>
                            <a
                                className="btn"
                                href={"mailto:" + open.email + "?subject=" + encodeURIComponent("Re: " + (open.subject || "Your message"))}
                            >
                                Reply by email
                            </a>
                            <button type="button" className="btn ghost" onClick={() => setOpen(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default MessagesAdmin;