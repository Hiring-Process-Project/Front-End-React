// src/components/OccupationOverview.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, CardBody, Spinner, Progress } from 'reactstrap';

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

/* ---------- Score Histogram (0–100) ---------- */
function ScoreHistogram({ buckets = [] }) {
    const max = useMemo(() => Math.max(1, ...buckets.map((b) => Number(b.count) || 0)), [buckets]);
    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Score Distribution (0–100)</div>
                <div style={{ height: 150, display: 'flex', alignItems: 'end', gap: 8, padding: '8px 4px' }}>
                    {buckets.map((b, i) => {
                        const h = ((Number(b.count) || 0) / max) * 100;
                        const label = b.range || `${b.from}–${b.to}`;
                        return (
                            <div
                                key={b.from ?? i}
                                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                            >
                                <div style={{ width: '100%', height: 120, display: 'flex', alignItems: 'end' }}>
                                    <div
                                        style={{
                                            width: '100%',
                                            height: `${h}%`,
                                            background: '#e9ecef',
                                            borderRadius: 4,
                                            boxShadow: 'inset 0 0 1px rgba(0,0,0,.15)',
                                        }}
                                    />
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

/* ---------- MAIN COMPONENT ---------- */
export default function OccupationOverview({ deptId, occId, base = '/api' }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!deptId || !occId) return;
        const ac = new AbortController();
        setLoading(true);
        setErr('');
        fetch(`${base}/statistics/occupation/${deptId}/${occId}`, {
            headers: { Accept: 'application/json' },
            signal: ac.signal,
        })
            .then((r) =>
                r.ok
                    ? r.json()
                    : r
                        .text()
                        .then((t) => Promise.reject(new Error(`HTTP ${r.status} ${r.statusText}: ${t?.slice(0, 200)}`)))
            )
            .then((json) => {
                setData(json);
                setLoading(false);
            })
            .catch((e) => {
                if (e.name !== 'AbortError') {
                    setErr(e.message || 'Failed');
                    setLoading(false);
                }
            });
        return () => ac.abort();
    }, [deptId, occId, base]);

    if (!deptId || !occId) return <div className="text-muted">No occupation selected.</div>;
    if (loading) {
        return (
            <div className="d-flex align-items-center" style={{ gap: 8 }}>
                <Spinner size="sm" /> <span>Loading occupation analytics…</span>
            </div>
        );
    }
    if (err) return <div className="text-danger">Error: {err}</div>;
    if (!data) return null;

    const {
        approvalRate = 0,
        rejectionRate = 0,
        candidatesPerJobAd = 0,
        scoreDistribution = [],
    } = data;

    return (
        <>
            <Row className="g-3">
                <Col lg="6">
                    <ApprovalRejection approvalRate={approvalRate} rejectionRate={rejectionRate} />
                </Col>
                <Col lg="6">
                    <Kpi title="Candidates per Job Ad" value={fmtNumber(candidatesPerJobAd)} sub="Average for this occupation" />
                </Col>
            </Row>

            <Row className="g-3 mt-1">
                <Col lg="12">
                    <ScoreHistogram buckets={scoreDistribution} />
                </Col>
            </Row>
        </>
    );
}
