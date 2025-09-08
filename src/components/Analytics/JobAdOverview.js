import React, { useEffect, useState } from 'react';
import { Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner } from 'reactstrap';

/* ---------- Small UI bits ---------- */
const Kpi = ({ title, value, sub }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
            <strong className="metric-number">{value}</strong>
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
                <div style={{ width: `${Math.max(0, 100 - (ap + rj + (showHired ? hr : 0)))}%`, height: '100%', background: '#6b7280', display: 'inline-block' }} />
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
            <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 6 }}>Each bar = candidates in that score range</div>
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

export default function JobAdOverview({ jobAdId, base = 'http://localhost:8087/api' }) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [stats, setStats] = useState(null);
    const [diffTab, setDiffTab] = useState('step'); // 'step' | 'question' | 'skill'

    useEffect(() => {
        if (!jobAdId) { setStats(null); return; }
        let ignore = false;
        setLoading(true); setErr('');
        fetch(`${base}/statistics/jobad/${jobAdId}`, { headers: { Accept: 'application/json' } })
            .then(async (r) => { if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`)); return r.json(); })
            .then((j) => { if (!ignore) setStats(j); })
            .catch((e) => { if (!ignore) setErr(String(e.message || e)); })
            .finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [jobAdId, base]);

    const approvalRate = stats?.approvalRate ?? stats?.approval_rate;
    const rejectionRate = stats?.rejectionRate ?? stats?.rejection_rate;
    const hireRate = stats?.hireRate ?? stats?.hire_rate;
    const hireCount = stats?.hireCount ?? stats?.hires ?? 0;
    const avgCandidateScore = stats?.avgCandidateScore ?? stats?.avg_score ?? stats?.averageScore;
    const distribution = stats?.scoreDistribution ?? stats?.distribution ?? [];
    const stepAverages = (stats?.stepAvg ?? stats?.stepAverages ?? []).map((s) => ({ label: s.step ?? s.title ?? s.name ?? '—', value: s.avgScore ?? s.averageScore ?? s.avg_score }));
    const questionDifficulty = (stats?.questionDiff ?? stats?.questionDifficulty ?? []).map((q) => ({ label: q.question ?? q.title ?? '—', value: q.avgScore ?? q.averageScore ?? q.avg_score }));
    const skillDifficulty = (stats?.skillDiff ?? stats?.skillDifficulty ?? []).map((s) => ({ label: s.skill ?? s.title ?? s.name ?? '—', value: s.avgScore ?? s.averageScore ?? s.avg_score }));
    const totalCandidates = stats?.totalCandidates ?? stats?.total ?? 0;
    const complete = !!stats?.complete;

    const diffMap = {
        step: { title: 'Step Difficulty', items: stepAverages },
        question: { title: 'Question Difficulty', items: questionDifficulty },
        skill: { title: 'Skill Difficulty', items: skillDifficulty },
    };
    const current = diffMap[diffTab] ?? diffMap.step;

    return (
        <div className="overview-tab-wrap q-col-flex q-no-x">
            <Card className="shadow-sm q-card-fill">
                <CardBody className="q-card-body-scroll">
                    {loading && <div className="d-flex align-items-center" style={{ gap: 8 }}><Spinner size="sm" /> Loading…</div>}
                    {err && !loading && <div className="text-danger">Error: {err}</div>}
                    {!loading && !err && !stats && <div className="text-muted">No data.</div>}

                    {!loading && !err && stats && (
                        <>
                            <Row className="g-3">
                                <Col md="6">
                                    <Card className="shadow-sm h-100"><CardBody>
                                        <SegmentedBar approved={approvalRate} rejected={rejectionRate} hired={hireRate} />
                                    </CardBody></Card>
                                </Col>

                                <Col md="2">
                                    <Card className="shadow-sm h-100">
                                        <CardBody>
                                            <div style={{ fontSize: 12, opacity: 0.7 }}>Completion</div>
                                            <div className="d-flex flex-column align-items-start" style={{ gap: 6, marginTop: 6, width: '100%' }}>
                                                <span className={`badge ${complete ? 'bg-success' : 'bg-secondary'} text-white`} style={{ fontSize: 12, padding: '6px 10px' }}>
                                                    {complete ? 'Complete' : 'In progress'}
                                                </span>
                                                <div style={{ width: '100%', height: 1, background: '#e9ecef', margin: '10px 0' }} />
                                                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                                    <div style={{ fontSize: 12, opacity: 0.7 }}>Hires</div>
                                                    <strong className="metric-number">{hireCount}</strong>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col md="2"><Kpi title="Candidates" value={totalCandidates} /></Col>
                                <Col md="2"><Kpi title="Avg Candidate Score (0-100)" value={fmt1(avgCandidateScore)} /></Col>
                            </Row>

                            <Row className="g-3 mt-1">
                                <Col md="6">
                                    <Card className="shadow-sm h-100"><CardBody>
                                        <Histogram buckets={distribution} />
                                    </CardBody></Card>
                                </Col>

                                <Col md="6">
                                    <Card className="shadow-sm h-100"><CardBody>
                                        <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8 }}>
                                            <div style={{ fontWeight: 600 }}>
                                                {current.title} <span style={{ fontSize: 12, opacity: .6 }}>(lower = harder)</span>
                                            </div>
                                            <select
                                                className="form-select form-select-sm"
                                                style={{ width: 220 }}
                                                value={diffTab}
                                                onChange={(e) => setDiffTab(e.target.value)}
                                            >
                                                <option value="step">Step Difficulty</option>
                                                <option value="question">Question Difficulty</option>
                                                <option value="skill">Skill Difficulty</option>
                                            </select>
                                        </div>

                                        <ListGroup flush>
                                            {(current.items?.length ?? 0) === 0 && <ListGroupItem className="text-muted">—</ListGroupItem>}
                                            {(current.items ?? []).map((it, i) => (
                                                <ListGroupItem key={`${diffTab}-${i}`} className="d-flex align-items-center justify-content-between">
                                                    <span>{it.label}</span>
                                                    <strong>{fmt1(it.value)}</strong>
                                                </ListGroupItem>
                                            ))}
                                        </ListGroup>
                                    </CardBody></Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
