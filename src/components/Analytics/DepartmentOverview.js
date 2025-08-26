import React, { useEffect, useMemo, useState } from 'react';
import {
    Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner, Progress
} from 'reactstrap';

const Kpi = ({ title, value, sub }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div style={{ fontSize: 12, opacity: .7 }}>{title}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
            {sub && <div style={{ fontSize: 12, opacity: .6, marginTop: 4 }}>{sub}</div>}
        </CardBody>
    </Card>
);

const fmtPercent = (n) => (Number.isFinite(Number(n)) ? `${Number(n).toFixed(1)}%` : '—');
const fmtNumber = (n) => (Number.isFinite(Number(n)) ? Number(n).toFixed(1) : '—');

/* ---------- Approval vs Rejection (stacked progress) ---------- */
function ApprovalRejection({ approvalRate = 0, rejectionRate = 0 }) {
    const other = Math.max(0, 100 - (Number(approvalRate) + Number(rejectionRate)));
    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Approval vs Rejection</div>
                <div className="d-flex justify-content-between" style={{ fontSize: 12, marginBottom: 6 }}>
                    <span>Approved {fmtPercent(approvalRate)}</span>
                    <span>Rejected {fmtPercent(rejectionRate)}</span>
                    {other > 0 && <span>Other {other.toFixed(1)}%</span>}
                </div>
                <Progress multi>
                    <Progress bar value={approvalRate} />
                    <Progress bar color="danger" value={rejectionRate} />
                    {other > 0 && <Progress bar color="secondary" value={other} />}
                </Progress>
            </CardBody>
        </Card>
    );
}

/* ---------- Score Histogram (0–100) ---------- */
function ScoreHistogram({ buckets = [] }) {
    const max = useMemo(() => Math.max(1, ...buckets.map(b => Number(b.count) || 0)), [buckets]);
    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Score Distribution (0–100)</div>
                <div style={{ height: 150, display: 'flex', alignItems: 'end', gap: 8, padding: '8px 4px' }}>
                    {buckets.map((b) => {
                        const h = (Number(b.count) || 0) / max * 100;
                        return (
                            <div key={b.from}
                                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: '100%', height: 120, display: 'flex', alignItems: 'end' }}>
                                    <div style={{
                                        width: '100%', height: `${h}%`, background: '#e9ecef',
                                        borderRadius: 4, boxShadow: 'inset 0 0 1px rgba(0,0,0,.15)'
                                    }} />
                                </div>
                                <div style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{b.range}</div>
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </Card>
    );
}

/* ---------- Step Difficulty Heatmap ---------- */
function StepHeatmap({ items = [] }) {
    // χρώμα: 0=κόκκινο → 10=πράσινο (HSL hue 0..120)
    const colorFor = (avg) => `hsl(${Math.max(0, Math.min(120, (avg / 10) * 120))} 70% 45%)`;
    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Step Difficulty</div>
                <ListGroup flush>
                    {!items?.length && <ListGroupItem className="text-muted">—</ListGroupItem>}
                    {items?.map(s => (
                        <ListGroupItem key={s.step} className="d-flex align-items-center justify-content-between">
                            <span>{s.step}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 120, height: 10, borderRadius: 6,
                                    background: '#f1f3f5', overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${(Number(s.averageScore) || 0) / 10 * 100}%`,
                                        height: '100%', background: colorFor(Number(s.averageScore) || 0)
                                    }} />
                                </div>
                                <strong>{(Number(s.averageScore) || 0).toFixed(1)}</strong>
                            </div>
                        </ListGroupItem>
                    ))}
                </ListGroup>
            </CardBody>
        </Card>
    );
}

/* ---------- Occupation Difficulty (lower = harder) ---------- */
function OccupationDifficulty({ items = [] }) {
    const sorted = [...(items || [])].sort((a, b) => (a.averageScore ?? 0) - (b.averageScore ?? 0));
    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    Occupation Difficulty Index <span className="text-muted" style={{ fontSize: 12 }}>(lower = harder)</span>
                </div>
                <ListGroup flush>
                    {!sorted.length && <ListGroupItem className="text-muted">—</ListGroupItem>}
                    {sorted.map(o => (
                        <ListGroupItem key={o.occupation} className="d-flex align-items-center justify-content-between">
                            <span>{o.occupation}</span>
                            <strong>{(Number(o.averageScore) || 0).toFixed(1)}</strong>
                        </ListGroupItem>
                    ))}
                </ListGroup>
            </CardBody>
        </Card>
    );
}

export default function DepartmentOverview({ deptId, base = '/api' }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!deptId) return;
        const ac = new AbortController();
        setLoading(true);
        setErr('');
        fetch(`${base}/statistics/department/${deptId}`, {
            headers: { Accept: 'application/json' },
            signal: ac.signal
        })
            .then(r => r.ok ? r.json()
                : r.text().then(t => Promise.reject(new Error(`HTTP ${r.status} ${r.statusText}: ${t?.slice(0, 200)}`))))
            .then(json => { setData(json); setLoading(false); })
            .catch(e => { if (e.name !== 'AbortError') { setErr(e.message || 'Failed'); setLoading(false); } });
        return () => ac.abort();
    }, [deptId, base]);

    if (!deptId) return <div className="text-muted">No department selected.</div>;
    if (loading) return <div className="d-flex align-items-center" style={{ gap: 8 }}><Spinner size="sm" /> <span>Loading department analytics…</span></div>;
    if (err) return <div className="text-danger">Error: {err}</div>;
    if (!data) return null;

    const {
        approvalRate = 0,
        rejectionRate = 0,
        candidatesPerJobAd = 0,
        scoreDistribution = [],
        stepDifficulty = [],
        occupationDifficulty = []
    } = data;

    return (
        <>
            <Row className="g-3">
                <Col lg="6"><ApprovalRejection approvalRate={approvalRate} rejectionRate={rejectionRate} /></Col>
                <Col lg="6"><Kpi title="Candidates per Job Ad" value={fmtNumber(candidatesPerJobAd)} sub="Average across department job ads" /></Col>
            </Row>

            <Row className="g-3 mt-1">
                <Col lg="6"><ScoreHistogram buckets={scoreDistribution} /></Col>
                <Col lg="6"><StepHeatmap items={stepDifficulty} /></Col>
            </Row>

            <Row className="g-3 mt-1">
                <Col lg="12"><OccupationDifficulty items={occupationDifficulty} /></Col>
            </Row>
        </>
    );
}
