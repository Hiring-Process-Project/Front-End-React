import React, { useEffect, useState } from 'react';
import { Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner } from 'reactstrap';

const Kpi = ({ title, value, sub }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
            {sub && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{sub}</div>}
        </CardBody>
    </Card>
);

const fmt = (n, d = 1) => (Number.isFinite(Number(n)) ? Number(n).toFixed(d) : '—');
const fmtPercent = (n) => (Number.isFinite(Number(n)) ? `${Number(n).toFixed(1)}%` : '—');

export default function StepsTab({
    apiBase = 'http://localhost:8087/api',
    jobAdId,
    onSelectStep,
}) {
    const [steps, setSteps] = useState([]);
    const [stepsLoading, setStepsLoading] = useState(false);
    const [stepsErr, setStepsErr] = useState('');

    const [selectedStepId, setSelectedStepId] = useState(null);

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    // list of steps
    useEffect(() => {
        if (!jobAdId) {
            setSteps([]); setSelectedStepId(null); setStepsErr(''); setStepsLoading(false);
            return;
        }
        const ac = new AbortController();
        setStepsLoading(true); setStepsErr('');

        (async () => {
            const endpoints = [
                `${apiBase}/statistics/jobad/${jobAdId}/steps`,
                `${apiBase}/jobads/${jobAdId}/steps`,
            ];
            for (const url of endpoints) {
                try {
                    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ac.signal });
                    if (!res.ok) continue;
                    const data = await res.json();
                    const norm = (Array.isArray(data) ? data : [])
                        .map(s => ({ id: s.id ?? s.stepId ?? s.step_id, title: s.title ?? s.name ?? `Step ${s.id ?? ''}` }))
                        .filter(x => x.id != null);
                    setSteps(norm);
                    setStepsLoading(false);
                    const first = norm[0]?.id ?? null;
                    setSelectedStepId(prev => norm.some(s => s.id === prev) ? prev : first);
                    return;
                } catch (_) { }
            }
            setSteps([]); setSelectedStepId(null); setStepsErr('No steps.'); setStepsLoading(false);
        })();

        return () => ac.abort();
    }, [apiBase, jobAdId]);

    // stats
    useEffect(() => {
        if (!jobAdId || !selectedStepId) {
            setStats(null); setErr(''); setLoading(false);
            return;
        }
        const ac = new AbortController();
        setLoading(true); setErr('');

        (async () => {
            const endpoints = [
                `${apiBase}/statistics/jobad/${jobAdId}/step/${selectedStepId}`,
                `${apiBase}/jobads/${jobAdId}/steps/${selectedStepId}/stats`,
            ];
            for (const url of endpoints) {
                try {
                    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ac.signal });
                    if (!res.ok) continue;
                    const json = await res.json();
                    setStats(json); setLoading(false); return;
                } catch (_) { }
            }
            setStats(null); setErr('No analytics for this step.'); setLoading(false);
        })();

        return () => ac.abort();
    }, [apiBase, jobAdId, selectedStepId]);

    if (!jobAdId) return <div className="text-muted">Select a Job Ad to view steps and step analytics.</div>;

    return (
        <Row className="g-3">
            <Col lg="4">
                <Card className="shadow-sm h-100">
                    <CardBody>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Steps</div>
                        {stepsLoading && <div className="d-flex align-items-center" style={{ gap: 8 }}>
                            <Spinner size="sm" /> <span>Loading steps…</span>
                        </div>}
                        {!stepsLoading && steps.length === 0 && (
                            <div className="text-muted" style={{ fontSize: 12 }}>{stepsErr || 'No steps.'}</div>
                        )}
                        <ListGroup flush style={{ maxHeight: 260, overflow: 'auto' }}>
                            {steps.map(s => (
                                <ListGroupItem
                                    key={s.id}
                                    active={s.id === selectedStepId}
                                    tag="button" action
                                    onClick={() => { setSelectedStepId(s.id); onSelectStep?.(s.id); }}
                                    className="d-flex align-items-center justify-content-between"
                                >
                                    <span>{s.title}</span>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    </CardBody>
                </Card>
            </Col>

            <Col lg="8">
                {!selectedStepId && <div className="text-muted">Select a step to see analytics.</div>}
                {selectedStepId && (
                    <Card className="shadow-sm">
                        <CardBody>
                            {loading && <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                <Spinner size="sm" /> <span>Loading step analytics…</span>
                            </div>}
                            {err && <div className="text-danger">Error: {err}</div>}

                            {stats && (
                                <>
                                    <Row className="g-3">
                                        <Col md="6"><Kpi title="Pass Rate" value={fmtPercent(stats.passRate)} sub="score ≥ 50%" /></Col>
                                        <Col md="6"><Kpi title="Avg Step Score" value={fmt(stats.avgStepScore, 1)} sub="0–10" /></Col>
                                    </Row>

                                    <Row className="g-3 mt-1">
                                        <Col md="12">
                                            <Card className="shadow-sm h-100">
                                                <CardBody>
                                                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Score Distribution</div>
                                                    <ListGroup flush>
                                                        {(stats.scoreDistribution ?? []).map((b, i) => (
                                                            <ListGroupItem key={i} className="d-flex align-items-center justify-content-between">
                                                                <span>{b.range ?? `${b.from}-${b.to}`}</span>
                                                                <strong>{b.count ?? b.cnt ?? 0}</strong>
                                                            </ListGroupItem>
                                                        ))}
                                                        {(!stats.scoreDistribution || stats.scoreDistribution.length === 0) &&
                                                            <ListGroupItem className="text-muted">—</ListGroupItem>}
                                                    </ListGroup>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row className="g-3 mt-1">
                                        <Col md="6">
                                            <Card className="shadow-sm h-100">
                                                <CardBody>
                                                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Question Ranking</div>
                                                    <ListGroup flush>
                                                        {(stats.questionRanking ?? []).map(q => (
                                                            <ListGroupItem key={q.question} className="d-flex align-items-center justify-content-between">
                                                                <span>{q.question}</span>
                                                                <strong>{fmt(q.avgScore ?? q.averageScore, 1)}</strong>
                                                            </ListGroupItem>
                                                        ))}
                                                        {(!stats.questionRanking || stats.questionRanking.length === 0) &&
                                                            <ListGroupItem className="text-muted">—</ListGroupItem>}
                                                    </ListGroup>
                                                </CardBody>
                                            </Card>
                                        </Col>

                                        <Col md="6">
                                            <Card className="shadow-sm h-100">
                                                <CardBody>
                                                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Skill Ranking</div>
                                                    <ListGroup flush>
                                                        {(stats.skillRanking ?? []).map(s => (
                                                            <ListGroupItem key={s.skill} className="d-flex align-items-center justify-content-between">
                                                                <span>{s.skill}</span>
                                                                <strong>{fmt(s.avgScore ?? s.averageScore, 1)}</strong>
                                                            </ListGroupItem>
                                                        ))}
                                                        {(!stats.skillRanking || stats.skillRanking.length === 0) &&
                                                            <ListGroupItem className="text-muted">—</ListGroupItem>}
                                                    </ListGroup>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>
                                </>
                            )}
                        </CardBody>
                    </Card>
                )}
            </Col>
        </Row>
    );
}
