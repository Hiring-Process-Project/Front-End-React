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

export default function OrganizationOverview({ orgId = 3, base = '/api' }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    useEffect(() => {
        const ac = new AbortController();
        setLoading(true);
        setErr('');

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

    const { approvalRate, rejectionRate, hireRate, hireCount, top5Skills = [], weakest5Skills = [] } = stats;

    return (
        <>
            <Row className="g-3">
                <Col md="3"><Kpi title="Approval Rate" value={fmtPercent(approvalRate)} /></Col>
                <Col md="3"><Kpi title="Rejection Rate" value={fmtPercent(rejectionRate)} /></Col>
                <Col md="3"><Kpi title="Hire Rate" value={fmtPercent(hireRate)} /></Col>
                <Col md="3"><Kpi title="Hire Number" value={fmtNumber(hireCount)} /></Col>
            </Row>

            <Row className="g-3 mt-1">
                <Col lg="6"><SkillList title="Top 5 Skills" items={top5Skills} /></Col>
                <Col lg="6"><SkillList title="Weakest 5 Skills" items={weakest5Skills} /></Col>
            </Row>
        </>
    );
}
