import React, { useEffect, useState } from 'react';
import { Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner } from 'reactstrap';

/* ---------- Small UI bits ---------- */
const Kpi = ({ title, value, sub }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
            <div className="metric-number">{value}</div>
            {sub && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{sub}</div>}
        </CardBody>
    </Card>
);

const fmt1 = (n) => (Number.isFinite(+n) ? (+n).toFixed(1) : '—');
const SEG_COLORS = { ap: '#3b82f6', rj: '#ef4444', hr: '#16a34a', pd: '#6b7280' };

function SegmentedBar({ approved = 0, rejected = 0, hired = 0, showHired = true }) {
    let ap = Math.max(0, Math.min(100, +approved || 0));
    let rj = Math.max(0, Math.min(100, +rejected || 0));
    let hr = showHired ? Math.max(0, Math.min(100, +hired || 0)) : 0;

    const sum = ap + rj + (showHired ? hr : 0);
    if (sum > 100) {
        const f = 100 / sum;
        ap *= f; rj *= f; if (showHired) hr *= f;
    }
    const pending = Math.max(0, 100 - (ap + rj + (showHired ? hr : 0)));
    const fmtPct = (n) => `${n.toFixed(1)}%`;

    return (
        <div>
            <div className="d-flex" style={{ gap: 16, flexWrap: 'wrap', fontSize: 12, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: SEG_COLORS.ap, display: 'inline-block' }} />
                    <span>Approved</span>
                    <strong style={{ color: SEG_COLORS.ap }}>{fmtPct(ap)}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: SEG_COLORS.rj, display: 'inline-block' }} />
                    <span>Rejected</span>
                    <strong style={{ color: SEG_COLORS.rj }}>{fmtPct(rj)}</strong>
                </div>
                {showHired && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: SEG_COLORS.hr, display: 'inline-block' }} />
                        <span>Hired</span>
                        <strong style={{ color: SEG_COLORS.hr }}>{fmtPct(hr)}</strong>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: SEG_COLORS.pd, display: 'inline-block' }} />
                    <span>Pending</span>
                    <strong style={{ color: SEG_COLORS.pd }}>{fmtPct(pending)}</strong>
                </div>
            </div>

            <div style={{ height: 18, background: '#e9ecef', borderRadius: 10, overflow: 'hidden', marginTop: 6, whiteSpace: 'nowrap' }}>
                <div style={{ width: `${ap}%`, height: '100%', background: '#3b82f6', display: 'inline-block' }} />
                <div style={{ width: `${rj}%`, height: '100%', background: '#ef4444', display: 'inline-block' }} />
                {showHired && <div style={{ width: `${hr}%`, height: '100%', background: '#16a34a', display: 'inline-block' }} />}
                <div style={{ width: `${pending}%`, height: '100%', background: '#6b7280', display: 'inline-block' }} />
            </div>
        </div>
    );
}

/* Histogram 0–100 */
function Histogram({ buckets }) {
    const mapped = (Array.isArray(buckets) ? buckets : []).map((b, i) => ({
        label: b.range ?? `${b.from ?? i * 10}–${b.to ?? (i === 9 ? 100 : (i + 1) * 10)}`,
        value: Number(b.count ?? b.cnt ?? b.value ?? 0),
    }));
    const max = Math.max(1, ...mapped.map((x) => x.value));
    const total = mapped.reduce((s, x) => s + x.value, 0);

    return (
        <div>
            <div className="mb-2" style={{ fontWeight: 600 }}>Score Distribution (0–100)</div>
            <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 6 }}>
                Each bar = candidates in that score range
            </div>
            <div className="d-flex align-items-end" style={{ gap: 10, height: 150, padding: '8px 6px', border: '1px solid #eee', borderRadius: 8, background: '#fff' }}>
                {mapped.map((b, i) => {
                    const hPx = (b.value / max) * 120;
                    const pct = total > 0 ? `${((b.value / total) * 100).toFixed(1)}%` : '0%';
                    return (
                        <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <div style={{ fontSize: 10, opacity: 0.85, marginBottom: 4 }}>{pct}</div>
                                <div style={{ height: `${hPx}px`, background: '#e5e7eb', borderRadius: 6, width: '100%' }} title={`${b.label}: ${b.value} (${pct})`} />
                            </div>
                            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{b.label.replace('–', '-')}</div>
                        </div>
                    );
                })}
                {mapped.length === 0 && <div className="text-muted" style={{ fontSize: 12 }}>—</div>}
            </div>
        </div>
    );
}

export default function OrganizationOverview({ orgId = 3, base = 'http://localhost:8087/api' }) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [stats, setStats] = useState(null);

    useEffect(() => {
        let ignore = false;
        setLoading(true); setErr('');
        fetch(`${base}/statistics/organization/${orgId}`, { headers: { Accept: 'application/json' } })
            .then(async (r) => { if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`)); return r.json(); })
            .then((j) => { if (!ignore) setStats(j); })
            .catch((e) => { if (!ignore) setErr(String(e.message || e)); })
            .finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [orgId, base]);

    if (loading) return <div className="d-flex align-items-center" style={{ gap: 8 }}><Spinner size="sm" /> Loading…</div>;
    if (err) return <div className="text-danger">Error: {err}</div>;
    if (!stats) return null;

    return (
        <div>
            <Row className="g-3">
                <Col md="6">
                    <Card className="shadow-sm h-100"><CardBody>
                        <SegmentedBar approved={stats.approvalRate} rejected={stats.rejectionRate} hired={stats.hireRate} />
                    </CardBody></Card>
                </Col>

                <Col md="2">
                    <Kpi title="Hires" value={stats.hireCount ?? stats.hires ?? '—'} />
                </Col>
                <Col md="2">
                    <Kpi title="Candidates" value={stats.totalCandidates ?? stats.total ?? '—'} />
                </Col>
                {/* ΝΕΟ KPI */}
                <Col md="2">
                    <Kpi
                        title="Avg Candidates / Job Ad"
                        value={(Number.isFinite(+ (stats.avgCandidatesPerJobAd ?? stats.avg_cand_per_job ?? stats.candidatesPerJobAd))
                            ? (+ (stats.avgCandidatesPerJobAd ?? stats.avg_cand_per_job ?? stats.candidatesPerJobAd)).toFixed(1)
                            : '—')}
                    />
                </Col>
            </Row>

            {/* Top / Weakest skills όπως ήταν */}
            <Row className="g-3 mt-1">
                <Col md="6">
                    <Card className="shadow-sm h-100"><CardBody>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Top Skills</div>
                        <ListGroup flush>
                            {(stats.top5Skills ?? stats.topSkills ?? []).map((s, i) => (
                                <ListGroupItem key={`top-${i}`} className="d-flex align-items-center justify-content-between">
                                    <span>{s.skill ?? s.title ?? s.name ?? '—'}</span>
                                    <strong>{fmt1(s.avgScore ?? s.averageScore ?? s.avg_score)}</strong>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    </CardBody></Card>
                </Col>
                <Col md="6">
                    <Card className="shadow-sm h-100"><CardBody>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Weakest Skills</div>
                        <ListGroup flush>
                            {(stats.weakest5Skills ?? stats.weak5Skills ?? []).map((s, i) => (
                                <ListGroupItem key={`weak-${i}`} className="d-flex align-items-center justify-content-between">
                                    <span>{s.skill ?? s.title ?? s.name ?? '—'}</span>
                                    <strong>{fmt1(s.avgScore ?? s.averageScore ?? s.avg_score)}</strong>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    </CardBody></Card>
                </Col>
            </Row>

            {/* Histogram κάτω από τα skills και σε μισό πλάτος */}
            <Row className="g-3 mt-1">
                <Col md="6">
                    <Card className="shadow-sm h-100">
                        <CardBody>
                            <Histogram buckets={stats.scoreDistribution ?? stats.distribution ?? []} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
