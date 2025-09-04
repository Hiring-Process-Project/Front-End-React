import React, { useEffect, useState } from 'react';
import { Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner } from 'reactstrap';

const fmtPercent = (n) => (Number.isFinite(Number(n)) ? `${Number(n).toFixed(1)}%` : '—');
const fmtNumber = (n) => (Number.isFinite(Number(n)) ? Number(n) : '—');

const Kpi = ({ title, value }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div style={{ fontSize: 12, opacity: .7 }}>{title}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
        </CardBody>
    </Card>
);

const SkillList = ({ title, items }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
            <ListGroup flush>
                {!items?.length && <ListGroupItem className="text-muted">—</ListGroupItem>}
                {items?.map((s) => (
                    <ListGroupItem key={s.skill} className="d-flex justify-content-between align-items-center">
                        <span>{s.skill}</span>
                        <strong>{Number(s.averageScore ?? 0).toFixed(1)}</strong>
                    </ListGroupItem>
                ))}
            </ListGroup>
        </CardBody>
    </Card>
);

/** Απλό stacked bar με legend */
function StackedRateBar({ title, segments }) {
    // clip σε [0,100] και φτιάξε πλάτη (%)
    const totalShown = Math.max(
        0,
        Math.min(
            100,
            segments.reduce((a, s) => a + (Number.isFinite(s.value) ? s.value : 0), 0)
        )
    );

    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>

                <div
                    aria-label={title}
                    style={{
                        height: 14,
                        borderRadius: 999,
                        background: '#e5e7eb',
                        overflow: 'hidden',
                        display: 'flex',
                    }}
                >
                    {segments.map((s) => {
                        const w = Math.max(0, Math.min(100, s.value || 0));
                        return (
                            <div
                                key={s.label}
                                title={`${s.label} ${fmtPercent(s.value)}`}
                                style={{ width: `${w}%`, background: s.color }}
                            />
                        );
                    })}
                    {totalShown < 100 && (
                        <div style={{ width: `${100 - totalShown}%`, background: '#e5e7eb' }} />
                    )}
                </div>

                {/* legend */}
                <div style={{
                    display: 'flex',
                    gap: 16,
                    flexWrap: 'wrap',
                    marginTop: 8,
                    fontSize: 12
                }}>
                    {segments.map((s) => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                width: 10, height: 10, borderRadius: 3, background: s.color, display: 'inline-block'
                            }} />
                            <span style={{ opacity: .75 }}>{s.label}</span>
                            <strong>{fmtPercent(s.value)}</strong>
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}

export default function OrganizationOverview({ orgId = 3, base = '/api' }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    useEffect(() => {
        const ac = new AbortController();
        setLoading(true); setErr('');

        fetch(`${base}/statistics/organization/${orgId}`, {
            headers: { Accept: 'application/json' },
            signal: ac.signal,
        })
            .then((r) =>
                r.ok
                    ? r.json()
                    : r.text().then((t) => Promise.reject(new Error(`HTTP ${r.status} ${r.statusText}: ${t?.slice(0, 200)}`)))
            )
            .then((data) => { setStats(data); setLoading(false); })
            .catch((e) => { if (e.name !== 'AbortError') { setErr(e.message || 'Failed'); setLoading(false); } });

        return () => ac.abort();
    }, [orgId, base]);

    if (loading) {
        return (
            <div className="d-flex align-items-center" style={{ gap: 8 }}>
                <Spinner size="sm" /> <span>Loading organization analytics…</span>
            </div>
        );
    }
    if (err) return <div className="text-danger">Error: {err}</div>;
    if (!stats) return null;

    const {
        approvalRate = 0,
        rejectionRate = 0,
        hireRate = 0,
        hireCount,
        totalCandidates,
        top5Skills = [],
        weakest5Skills = [],
    } = stats;

    const apOnly = Math.max(0, Number(approvalRate) - Number(hireRate)); // Approved χωρίς τους Hired
    const rj = Math.max(0, Number(rejectionRate));
    const hr = Math.max(0, Number(hireRate));
    let pending = Math.max(0, 100 - (apOnly + rj + hr));                // ό,τι μένει είναι Pending

    const segments = [
        { label: 'Approved', value: apOnly, color: '#3b82f6' }, // μπλε
        { label: 'Rejected', value: rj, color: '#ef4444' }, // κόκκινο
        { label: 'Hired', value: hr, color: '#16a34a' }, // ΠΡΑΣΙΝΟ
        { label: 'Pending', value: pending, color: '#6b7280' }, // γκρι
    ];

    return (
        <>
            <Row className="g-3">
                {/* Stacked bar + δύο KPI όπως στο layout σου */}
                <Col md="6">
                    <StackedRateBar title="Approval / Rejection / Hire / Pending" segments={segments} />
                </Col>
                <Col md="3"><Kpi title="Hires" value={fmtNumber(hireCount)} /></Col>
                <Col md="3"><Kpi title="Candidates" value={fmtNumber(totalCandidates ?? stats.total)} /></Col>
            </Row>

            <Row className="g-3 mt-1">
                <Col lg="6"><SkillList title="Top 5 Skills" items={top5Skills} /></Col>
                <Col lg="6"><SkillList title="Weakest 5 Skills" items={weakest5Skills} /></Col>
            </Row>
        </>
    );
}
