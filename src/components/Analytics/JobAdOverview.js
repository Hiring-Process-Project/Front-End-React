// src/components/Analytics/JobAdOverview.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, CardBody, Spinner, Progress, ListGroup, ListGroupItem } from 'reactstrap';

const Kpi = ({ title, value, sub }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
            {sub && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{sub}</div>}
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

/* ---------- Small status card: Complete/Open ---------- */
function StatusCard({ complete = false }) {
    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Job Ad Status</div>
                <div className="d-flex align-items-center" style={{ gap: 8, marginTop: 2 }}>
                    <span
                        style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: complete ? '#16a34a' : '#6b7280', display: 'inline-block'
                        }}
                    />
                    <div style={{ fontSize: 22, fontWeight: 700 }}>
                        {complete ? 'Complete' : 'Open'}
                    </div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                    {complete ? 'At least one candidate hired' : 'No hires yet'}
                </div>
            </CardBody>
        </Card>
    );
}

/* ---------- Score Histogram (0–100) ---------- */
function ScoreHistogram({ buckets = [] }) {
    const max = useMemo(
        () => Math.max(1, ...buckets.map(b => Number(b.count ?? b.cnt ?? b.value) || 0)),
        [buckets]
    );

    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Score Distribution (0–100)</div>
                <div style={{ height: 150, display: 'flex', alignItems: 'end', gap: 8, padding: '8px 4px' }}>
                    {buckets.map((b, i) => {
                        const val = Number(b.count ?? b.cnt ?? b.value) || 0;
                        const h = (val / max) * 100;
                        const label = b.range || `${(b.from ?? i * 10)}–${(b.to ?? (i === 9 ? 100 : (i * 10 + 9)))}`;
                        const key = b.from ?? `b-${i}`;
                        return (
                            <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: '100%', height: 120, display: 'flex', alignItems: 'end' }}>
                                    <div style={{ width: '100%', height: `${h}%`, background: '#e9ecef', borderRadius: 4, boxShadow: 'inset 0 0 1px rgba(0,0,0,.15)' }} />
                                </div>
                                <div style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{label}</div>
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </Card>
    );
}

/* ---------- Generic Difficulty List (low → high) ---------- */
function DifficultyList({ title, items = [], labelKey = 'name' }) {
    const getVal = (x) => x?.averageScore ?? x?.avgScore ?? x?.value ?? 0;
    const sorted = [...(items || [])].sort((a, b) => getVal(a) - getVal(b));
    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    {title} <span className="text-muted" style={{ fontSize: 12 }}>(lower = harder)</span>
                </div>
                <ListGroup flush>
                    {!sorted.length && <ListGroupItem className="text-muted">—</ListGroupItem>}
                    {sorted.map((o, i) => (
                        <ListGroupItem key={(o[labelKey] ?? i)} className="d-flex align-items-center justify-content-between">
                            <span>{o[labelKey]}</span>
                            <strong>{(Number(getVal(o)) || 0).toFixed(1)}</strong>
                        </ListGroupItem>
                    ))}
                </ListGroup>
            </CardBody>
        </Card>
    );
}

/* ---------- MAIN ---------- */
export default function JobAdOverview({ jobAdId, base = '/api' }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    // νέο: πληροφορίες υποψηφίων του συγκεκριμένου job ad
    const [candInfo, setCandInfo] = useState({ total: 0, complete: false });

    useEffect(() => {
        if (!jobAdId) return;
        const ac = new AbortController();
        setLoading(true);
        setErr('');
        fetch(`${base}/statistics/jobad/${jobAdId}`, { headers: { Accept: 'application/json' }, signal: ac.signal })
            .then(r => r.ok ? r.json() : r.text().then(t => Promise.reject(new Error(`HTTP ${r.status} ${r.statusText}: ${t?.slice(0, 200)}`))))
            .then(json => { setData(json); setLoading(false); })
            .catch(e => { if (e.name !== 'AbortError') { setErr(e.message || 'Failed'); setLoading(false); } });
        return () => ac.abort();
    }, [jobAdId, base]);

    // νέο: φερε τους candidates για total + hired check
    useEffect(() => {
        if (!jobAdId) return;
        const ac = new AbortController();
        fetch(`${base}/statistics/jobad/${jobAdId}/candidates`, { headers: { Accept: 'application/json' }, signal: ac.signal })
            .then(r => (r.ok ? r.json() : Promise.resolve([])))
            .then(arr => {
                const list = Array.isArray(arr) ? arr : [];
                const total = list.length;
                const complete = list.some(c => String(c?.status ?? c?.state ?? '').toLowerCase() === 'hired');
                setCandInfo({ total, complete });
            })
            .catch(() => { /* σιωπηλά */ });
        return () => ac.abort();
    }, [jobAdId, base]);

    if (!jobAdId) return <div className="text-muted">No job ad selected.</div>;
    if (loading) return <div className="d-flex align-items-center" style={{ gap: 8 }}><Spinner size="sm" /> <span>Loading job ad analytics…</span></div>;
    if (err) return <div className="text-danger">Error: {err}</div>;
    if (!data) return null;

    const {
        approvalRate = 0,
        rejectionRate = 0,
        avgCandidateScore = 0,
        scoreDistribution = [],
        stepAverages = [],            // <- changed: was stepAvg
        questionDifficulty = [],
        skillDifficulty = [],
    } = data;

    return (
        <>
            {/* Row 1: Approval + Status + Avg Score */}
            <Row className="g-3">
                <Col lg="6">
                    <ApprovalRejection approvalRate={approvalRate} rejectionRate={rejectionRate} />
                </Col>
                <Col lg="3">
                    <StatusCard complete={candInfo.complete} />
                </Col>
                <Col lg="3">
                    <Kpi title="Avg Candidate Score" value={fmtNumber(avgCandidateScore)} sub="0–10" />
                </Col>
            </Row>

            {/* Row 1.5: Total candidates (πάνω πριν από Step/Skill) */}
            <Row className="g-3 mt-1">
                <Col lg="12">
                    <Kpi title="Candidates" value={candInfo.total} sub="Total for this job ad" />
                </Col>
            </Row>

            <Row className="g-3 mt-1">
                <Col lg="6"><ScoreHistogram buckets={scoreDistribution} /></Col>
                {/* Step Difficulty (lower = harder) */}
                <Col lg="6"><DifficultyList title="Step Difficulty" items={stepAverages} labelKey="step" /></Col>
            </Row>

            <Row className="g-3 mt-1">
                <Col lg="6"><DifficultyList title="Question Difficulty" items={questionDifficulty} labelKey="question" /></Col>
                <Col lg="6"><DifficultyList title="Skill Difficulty" items={skillDifficulty} labelKey="skill" /></Col>
            </Row>
        </>
    );
}
