import { useEffect, useState } from "react";
import { apiRequest, getData } from "../adminpanel/api";
import { fmtDate, daysLeft } from "../utils/dates";
import "../css/circulars.css";

const SIZES = [10, 25, 50, 100];

const COLS = [
    { key: "organization", label: "Circulars Link", sort: true },
    { key: "designation", label: "Designation", sort: true },
    { key: "start_date", label: "Circular Start Date", sort: true },
    { key: "end_date", label: "Circular End Date", sort: true },
];

const compare = (a, b, key) => {
    const x = a[key];
    const y = b[key];
    if (!x && !y) return 0;
    if (!x) return 1; // empty values always go last
    if (!y) return -1;
    return String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" });
};

function CircularsScreen({ onBack }) {
    const [list, setList] = useState({ loading: true, error: "", cats: [], items: [] });
    const [tab, setTab] = useState("");
    const [size, setSize] = useState(10);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ key: "start_date", dir: "desc" });
    const [showClosed, setShowClosed] = useState(false);

    const load = () => {
        setList((l) => ({ ...l, loading: true, error: "" }));
        apiRequest("/public/circulars")
            .then((b) => {
                const d = getData(b) || {};
                setList({ loading: false, error: "", cats: d.categories || [], items: d.circulars || [] });
            })
            .catch((err) => setList({ loading: false, error: err.message, cats: [], items: [] }));
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [tab, size, q, sort, showClosed]);

    const active = list.cats.includes(tab) ? tab : list.cats[0] || "";

    let rows = list.items.filter((r) => r.category === active);
    const closedCount = rows.filter((r) => r.expired).length;
    if (!showClosed) rows = rows.filter((r) => !r.expired);

    const term = q.trim().toLowerCase();
    if (term) {
        rows = rows.filter(
            (r) =>
                (r.organization || "").toLowerCase().includes(term) ||
                (r.designation || "").toLowerCase().includes(term)
        );
    }

    rows = [...rows].sort((a, b) => {
        const c = compare(a, b, sort.key);
        return sort.dir === "asc" ? c : -c;
    });

    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const cur = Math.min(page, pages);
    const from = (cur - 1) * size;
    const slice = rows.slice(from, from + size);

    const pageNumbers = [];
    for (let p = Math.max(1, cur - 2); p <= Math.min(pages, cur + 2); p++) pageNumbers.push(p);

    const toggleSort = (key) =>
        setSort((s) => (s.key === key ? { key: key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: key, dir: "asc" }));

    const arrow = (key) => (sort.key === key ? (sort.dir === "asc" ? " ▲" : " ▼") : "");

    const ends = (r) => {
        const d = daysLeft(r.end_date);
        if (r.expired || d === null || d > 7) return null;
        return <small className="cr-left">{d === 0 ? "Last day today" : d + (d === 1 ? " day left" : " days left")}</small>;
    };

    return (
        <section className="cr-wrap">
           

            <header className="cr-head">
                <span className="eyebrow">Career</span>
                <h1> Job Circulars</h1>
                <p>Latest job circulars. Open the circular for details and press Apply Now before the end date.</p>
            </header>

            {list.loading && <div className="panel loading-box">Loading circulars...</div>}

            {list.error && (
                <div className="panel loading-box">
                    <p>Could not load the circulars: {list.error}</p>
                    <button type="button" className="btn" onClick={load}>Try again</button>
                </div>
            )}

            {!list.loading && !list.error && list.cats.length === 0 && (
                <div className="panel loading-box">
                    <h2>No circular yet</h2>
                    <p>New job circulars will be added soon.</p>
                </div>
            )}

            {list.cats.length > 0 && (
                <>
                    <div className="cr-tabs" role="tablist">
                        {list.cats.map((c) => (
                            <button
                                key={c}
                                type="button"
                                role="tab"
                                aria-selected={c === active}
                                className={c === active ? "on" : ""}
                                onClick={() => setTab(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <div className="cr-box">
                        <div className="cr-bar">
                            <label className="cr-show">
                                Show
                                <select
                                    value={String(size)}
                                    onChange={(e) => setSize(Number(e.target.value))}
                                >
                                    {SIZES.map((n) => (
                                        <option key={n} value={String(n)}>{n}</option>
                                    ))}
                                </select>
                                entries
                            </label>

                            <label className="cr-search">
                                Search:
                                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Organization or post" />
                            </label>
                        </div>

                        {closedCount > 0 && (
                            <label className="cr-closed">
                                <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
                                Show closed circulars too ({closedCount})
                            </label>
                        )}

                        <div className="cr-tbl-wrap">
                            <table className="cr-tbl">
                                <thead>
                                    <tr>
                                        <th className="cr-sn">SN</th>
                                        {COLS.map((c) => (
                                            <th key={c.key}>
                                                <button type="button" className="cr-sort" onClick={() => toggleSort(c.key)}>
                                                    {c.label}{arrow(c.key)}
                                                </button>
                                            </th>
                                        ))}
                                        <th className="cr-act">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {slice.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="cr-empty">No matching circular found.</td>
                                        </tr>
                                    ) : (
                                        slice.map((r, i) => (
                                            <tr key={r.id} className={r.expired ? "closed" : ""}>
                                                <td className="cr-sn" data-label="SN">{from + i + 1}</td>
                                                <td data-label="Circular">
                                                    {r.link_url ? (
                                                        <a href={r.link_url} target="_blank" rel="noopener noreferrer">{r.organization}</a>
                                                    ) : (
                                                        <span>{r.organization}</span>
                                                    )}
                                                </td>
                                                <td data-label="Designation">{r.designation || "-"}</td>
                                                <td data-label="Start date">{fmtDate(r.start_date)}</td>
                                                <td data-label="End date">
                                                    {fmtDate(r.end_date)}
                                                    {ends(r)}
                                                </td>
                                                <td className="cr-act" data-label="Action">
                                                    {r.expired ? (
                                                        <span className="cr-badge">Closed</span>
                                                    ) : r.apply_url ? (
                                                        <a className="cr-apply" href={r.apply_url} target="_blank" rel="noopener noreferrer">Apply Now</a>
                                                    ) : r.link_url ? (
                                                        <a className="cr-apply" href={r.link_url} target="_blank" rel="noopener noreferrer">View circular</a>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="cr-foot">
                            <span>
                                {total === 0
                                    ? "Showing 0 entries"
                                    : "Showing " + (from + 1) + " to " + Math.min(from + size, total) + " of " + total + " entries"}
                            </span>

                            <div className="cr-pages">
                                <button type="button" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>Previous</button>
                                {pageNumbers.map((p) => (
                                    <button key={p} type="button" className={p === cur ? "on" : ""} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button type="button" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Next</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

export default CircularsScreen;