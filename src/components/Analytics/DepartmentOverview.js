import React, { useEffect, useState } from 'react';
import { Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner, Progress } from 'reactstrap';

/* ---------- Small UI ---------- */
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

/* ---------- Segmented bar ---------- */
function ApprovalRejection({ approvalRate = 0, rejectionRate = 0, hireRate = 0 }) {
    const ap = Number(approvalRate) || 0;
    const rj = Number(rejectionRate) || 0;
    const hr = Number(hireRate) || 0;
    const pending = Math.max(0, 100 - (ap + rj + hr));

    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Approved / Rejected / Hired / Pending</div>
                <div className="d-flex justify-content-between" style={{ fontSize: 12, marginBottom: 6 }}>
                    <span>Approved {fmtPercent(ap)}</span>
                    <span>Rejected {fmtPercent(rj)}</span>
                    <span>Hired {fmtPercent(hr)}</span>
                    <span>Pending {fmtPercent(pending)}</span>
                </div>
                <Progress multi>
                    <Progress bar value={ap} />
                    <Progress bar color="danger" value={rj} />
                    <Progress bar color="success" value={hr} />
                    {pending > 0 && <Progress bar color="secondary" value={pending} />}
                </Progress>
            </CardBody>
        </Card>
    );
}

/* ---------- Histogram (0–100) ---------- */
function Histogram({ buckets = [] }) {
    const mapped = (Array.isArray(buckets) ? buckets : []).map((b, i) => ({
        label: b.range ?? `${b.from ?? i * 10}-${b.to ?? (i === 9 ? 100 : (i + 1) * 10)}`,
        value: Number(b.count ?? b.cnt) || 0,
        key: b.from ?? `${i}`,
    }));

    const total = mapped.reduce((s, x) => s + x.value, 0);
    const max = Math.max(1, ...mapped.map(x => x.value));

    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Score Distribution (0–100)</div>

                {total === 0 ? (
                    <div className="text-muted" style={{ fontSize: 12 }}>
                        No scored candidates yet in this scope.
                    </div>
                ) : (
                    <div style={{ height: 150, display: 'flex', alignItems: 'end', gap: 8, padding: '8px 4px' }}>
                        {mapped.map((b) => {
                            const h = (b.value / max) * 100;
                            return (
                                <div key={b.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: '100%', height: 120, display: 'flex', alignItems: 'end' }}>
                                        <div style={{
                                            width: '100%', height: `${h}%`, background: '#e9ecef',
                                            borderRadius: 4, boxShadow: 'inset 0 0 1px rgba(0,0,0,.15)', transition: 'height .3s ease'
                                        }} />
                                    </div>
                                    <div style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{b.label}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

/* ---------- Occupation Difficulty (lower = harder) ---------- */
function OccupationDifficulty({ items = [] }) {
    const scoreOf = (o) => Number(o.averageScore ?? o.avgScore ?? o.avg_score ?? 0);
    const nameOf = (o) => (o.occupation ?? o.title ?? o.name ?? '—');
    const sorted = [...(items || [])].sort((a, b) => scoreOf(a) - scoreOf(b));

    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Occupation Difficulty (lower = harder)</div>
                <ListGroup flush>
                    {!sorted.length && <ListGroupItem className="text-muted">—</ListGroupItem>}
                    {sorted.map((o, idx) => (
                        <ListGroupItem key={`${nameOf(o)}-${idx}`} className="d-flex align-items-center justify-content-between">
                            <span>{nameOf(o)}</span>
                            <strong>{scoreOf(o).toFixed(1)}</strong>
                        </ListGroupItem>
                    ))}
                </ListGroup>
            </CardBody>
        </Card>
    );
}

/* ---------- Main component ---------- */
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

    const approvalRate = data.approvalRate ?? data.approval_rate ?? 0;
    const rejectionRate = data.rejectionRate ?? data.rejection_rate ?? 0;
    const hireRate = data.hireRate ?? data.hire_rate ?? 0;
    const candidatesPerJobAd = data.candidatesPerJobAd ?? data.avgCandidatesPerJobAd ?? data.avg_cand_per_job ?? 0;
    const scoreDistribution = data.scoreDistribution ?? data.distribution ?? [];
    const occupationDifficulty = data.occupationDifficulty ?? data.occDifficulty ?? [];

    return (
        <>
            <Row className="g-3">
                <Col lg="6">
                    <ApprovalRejection
                        approvalRate={approvalRate}
                        rejectionRate={rejectionRate}
                        hireRate={hireRate}
                    />
                </Col>
                <Col lg="6">
                    <Kpi
                        title="Candidates per Job Ad"
                        value={fmtNumber(candidatesPerJobAd)}
                        sub="Average across department job ads"
                    />
                </Col>
            </Row>

            <Row className="g-3 mt-1">
                <Col lg="12">
                    <Histogram buckets={scoreDistribution} />
                </Col>
            </Row>

            <Row className="g-3 mt-1">
                <Col lg="12">
                    <OccupationDifficulty items={occupationDifficulty} />
                </Col>
            </Row>
        </>
    );
}
