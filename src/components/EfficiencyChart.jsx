import { useMemo, useState } from "react";

const W = 900;
const H = 380;
const PAD = { top: 56, right: 34, bottom: 48, left: 50 };
const TICKS = [0, 25, 50, 75, 100];

// Smooth curve (flat tangent)
function smoothPath(pts) {
    if (!pts.length) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const mx = (a.x + b.x) / 2;
        d += ` C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
    }
    return d;
}

function EfficiencyChart({ data = [], threshold = 60, accent = "#8b5cf6" }) {
    const [hover, setHover] = useState(null);

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const yOf = (v) => PAD.top + innerH - (Math.max(0, Math.min(100, v)) / 100) * innerH;

    const pts = useMemo(() => {
        const n = data.length;
        return data.map((d, i) => ({
            ...d,
            x: n === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (n - 1)) * innerW,
            y: yOf(d.value),
        }));
    }, [data]);

    const line = smoothPath(pts);
    const area =
        pts.length > 1
            ? `${line} L ${pts[pts.length - 1].x} ${yOf(0)} L ${pts[0].x} ${yOf(0)} Z`
            : "";

    const hp = hover !== null ? pts[hover] : null;
    const tipW = 150;
    const tipX = hp ? Math.min(Math.max(hp.x - tipW / 2, 4), W - tipW - 4) : 0;
    const tipY = hp ? (hp.y < PAD.top + 60 ? hp.y + 16 : hp.y - 62) : 0;

    return (
        <div className="eff-card">
            <style>{`
                .eff-card{
                    background:var(--card, #ffffff);
                    color:var(--ink, #1f2937);
                    border:1px solid var(--line, #e5e7eb);
                    border-radius:28px;
                    padding:28px 28px 20px;
                    margin-bottom:20px;
                    box-shadow:0 6px 24px rgba(0,0,0,.05);
                }
                .eff-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:6px}
                .eff-title{
                    display:flex;align-items:center;gap:10px;
                    font-size:20px;font-weight:800;margin:0;
                    color:var(--ink, #1f2937);
                }
                .eff-title svg{color:${accent}}
                .eff-badge{
                    font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;
                    padding:8px 14px;border-radius:10px;
                    background:var(--paper, rgba(127,127,127,.08));
                    border:1px solid var(--line, rgba(127,127,127,.18));
                    color:var(--muted, #6b7280);
                }
                .eff-scroll{overflow-x:auto}
                .eff-svg{display:block;width:100%;min-width:560px;height:auto;color:var(--ink, #1f2937)}
                .eff-svg text{font-family:inherit}
                .eff-grid{stroke:var(--line, #e5e7eb)}
                .eff-axis{fill:var(--muted, #6b7280)}
                .eff-line{stroke-dasharray:1;stroke-dashoffset:1;animation:effDraw 1.4s ease-out forwards}
                @keyframes effDraw{to{stroke-dashoffset:0}}
                .eff-area{opacity:0;animation:effFade .8s ease-out .9s forwards}
                @keyframes effFade{to{opacity:1}}
                .eff-dot{transition:r .15s ease}
                @media (prefers-reduced-motion: reduce){
                    .eff-line{animation:none;stroke-dashoffset:0}
                    .eff-area{animation:none;opacity:1}
                }
                @media (max-width:720px){
                    .eff-card{padding:20px 14px 14px;border-radius:20px}
                    .eff-title{font-size:17px}
                }
            `}</style>

            <div className="eff-head">
                <h3 className="eff-title">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                    </svg>
                    Efficiency Metric
                </h3>
                <span className="eff-badge">Cumulative score trend</span>
            </div>

            <div className="eff-scroll">
                <svg className="eff-svg" viewBox={`0 0 ${W} ${H}`} role="img"
                    aria-label="Exam score percentage trend">
                    <defs>
                        <linearGradient id="effFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
                            <stop offset="100%" stopColor={accent} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* legend */}
                    <g transform={`translate(${W / 2}, 26)`}>
                        <circle cx="-92" cy="0" r="5" fill={accent} />
                        <text x="-80" y="4" fontSize="12" fontWeight="700" fill={accent} letterSpacing=".6">
                            EXAM SCORE PERCENTAGE (%)
                        </text>
                    </g>

                    {/* grid + y labels */}
                    {TICKS.map((t) => (
                        <g key={t}>
                            <line className="eff-grid" x1={PAD.left} x2={W - PAD.right} y1={yOf(t)} y2={yOf(t)}
                                strokeDasharray="3 5" />
                            <text className="eff-axis" x={PAD.left - 14} y={yOf(t) + 4} fontSize="11" fontWeight="600"
                                textAnchor="end">{t}</text>
                        </g>
                    ))}

                    {/* threshold */}
                    <line x1={PAD.left} x2={W - PAD.right} y1={yOf(threshold)} y2={yOf(threshold)}
                        stroke="#10b981" strokeWidth="1.6" strokeDasharray="5 4" />
                    <text x={W - PAD.right} y={yOf(threshold) - 8} fontSize="11" fontWeight="700"
                        textAnchor="end" fill="#10b981">
                        Pass mark ({threshold}%)
                    </text>

                    {/* x labels */}
                    {pts.map((p, i) => (
                        <text key={i} className="eff-axis" x={p.x} y={H - PAD.bottom + 26} fontSize="11"
                            fontWeight="600" textAnchor="middle">
                            {p.label}
                        </text>
                    ))}

                    {/* area + line */}
                    {area && <path className="eff-area" d={area} fill="url(#effFill)" />}
                    {pts.length > 1 && (
                        <path className="eff-line" d={line} pathLength="1" fill="none"
                            stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    )}

                    {/* dots */}
                    {pts.map((p, i) => (
                        <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                            onClick={() => setHover(hover === i ? null : i)} style={{ cursor: "pointer" }}>
                            <circle cx={p.x} cy={p.y} r="18" fill="transparent" />
                            <circle className="eff-dot" cx={p.x} cy={p.y} r={hover === i ? 7 : 5}
                                fill={accent} stroke="var(--card, #fff)" strokeWidth="2" />
                        </g>
                    ))}

                    {/* tooltip */}
                    {hp && (
                        <g pointerEvents="none">
                            <line x1={hp.x} x2={hp.x} y1={hp.y} y2={yOf(0)}
                                stroke={accent} strokeOpacity="0.4" strokeDasharray="3 4" />
                            <rect x={tipX} y={tipY} width={tipW} height="46" rx="10"
                                fill="#111827" stroke="rgba(255,255,255,.15)" />
                            <text x={tipX + tipW / 2} y={tipY + 19} fontSize="11" fontWeight="600"
                                textAnchor="middle" fill="#d1d5db">
                                {(hp.title || hp.label).slice(0, 24)}
                            </text>
                            <text x={tipX + tipW / 2} y={tipY + 37} fontSize="14" fontWeight="800"
                                textAnchor="middle" fill="#fff">
                                {hp.value}%
                            </text>
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
}

export default EfficiencyChart;