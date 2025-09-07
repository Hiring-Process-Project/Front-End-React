import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner, Button } from 'reactstrap';

const Kpi = ({ title, value, sub }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
            <div className="metric-number">{value}</div>
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

    // NEW: find selected step object for the header
    const selectedStep = useMemo(
        () => steps.find(s => s.id === selectedStepId) || null,
        [steps, selectedStepId]
    );

    // Fetch steps
    useEffect(() => {
        if (!jobAdId) {
            setSteps([]); setSelectedStepId(null); setStepsErr(''); setStepsLoading(false);
            onSelectStep?.(null);
            return;
        }
        const ac = new AbortController();
        setStepsLoading(true);
        setStepsErr('');

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
                    setSelectedStepId(null);
                    onSelectStep?.(null);
                    setStepsErr('');
                    return;
                } catch { /* try next endpoint */ }
            }
            setSteps([]); setSelectedStepId(null);
            setStepsErr('No steps.');
            setStepsLoading(false);
            onSelectStep?.(null);
        })();

        return () => ac.abort();
    }, [apiBase, jobAdId]);

    // Fetch step analytics
    useEffect(() => {
        if (!jobAdId || !selectedStepId) { setStats(null); setErr(''); setLoading(false); return; }
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
                    setStats(json); setLoading(false);
                    return;
                } catch { }
            }
            setStats(null); setErr('No analytics for this step.'); setLoading(false);
        })();

        return () => ac.abort();
    }, [apiBase, jobAdId, selectedStepId]);

    if (!jobAdId) return <div className="text-muted">Select a Job Ad to view steps and step analytics.</div>;

    function StepScoreHistogram({ buckets = [] }) {
        const counts = buckets.map(b => Number(b.count) || 0);
        const max = Math.max(1, ...counts);
        const total = counts.reduce((a, n) => a + n, 0);

        const labelFor = (b, idx) => {
            const from = Number(b?.from ?? idx * 10);
            const rawTo = Number(b?.to ?? (idx === 9 ? 100 : (idx + 1) * 10));
            const to = rawTo === 100 ? 100 : rawTo - 1;
            return `${from}-${to}`;
        };

        return (
            <Card className="shadow-sm h-100">
                <CardBody>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Score Distribution (0–100)</div>
                    <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 6 }}>
                        Each bar = candidates in that score range
                    </div>
                    <div
                        className="d-flex align-items-end"
                        style={{
                            gap: 10,
                            height: 150,
                            padding: '8px 6px',
                            border: '1px solid #eee',
                            borderRadius: 8,
                            background: '#fff',
                        }}
                    >
                        {buckets.map((b, i) => {
                            const count = Number(b.count) || 0;
                            const hPx = (count / max) * 120;
                            const label = labelFor(b, i);
                            const pct = total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%';
                            const title = `${label} : ${count} (${pct})`;

                            return (
                                <div key={(b.from ?? i) + '-' + (b.to ?? i)} style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <div style={{ fontSize: 10, opacity: 0.85, marginBottom: 4 }}>{pct}</div>
                                        <div
                                            title={title}
                                            style={{ height: `${hPx}px`, background: '#e9ecef', borderRadius: 6, width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }} title={title}>
                                        {label}
                                    </div>
                                </div>
                            );
                        })}
                        {(!buckets || buckets.length === 0) && (
                            <div className="text-muted" style={{ fontSize: 12 }}>—</div>
                        )}
                    </div>
                </CardBody>
            </Card>
        );
    }

    /* --- εμφανίση "passed/total(XX.X%)" --- */
    const passValue = (() => {
        if (!stats) return '—';
        const rate = Number(stats.passRate);
        const buckets = Array.isArray(stats.scoreDistribution) ? stats.scoreDistribution : [];
        const total = buckets.reduce((a, b) => a + (Number(b.count) || 0), 0);

        let passCount = Number(stats.passCount);
        if (!Number.isFinite(passCount)) {
            passCount = buckets.reduce((a, b, i) => {
                const from = Number(b?.from ?? i * 10);
                return a + (from >= 50 ? (Number(b.count) || 0) : 0);
            }, 0);
            if (!Number.isFinite(passCount) && Number.isFinite(rate) && total > 0) {
                passCount = Math.round((rate / 100) * total);
            }
        }

        if (!(Number.isFinite(passCount) && total > 0)) return fmtPercent(rate);

        const pctText = Number.isFinite(rate) ? `(${rate.toFixed(1)}%)` : '';
        return (
            <>
                <span>{passCount}/{total}</span>
                {pctText && (
                    <span
                        style={{
                            marginLeft: 8,
                            fontWeight: 500,
                            fontSize: 18,
                            color: '#6c757d',
                        }}
                    >
                        {pctText}
                    </span>
                )}
            </>
        );
    })();

    // Avg step score in 0–100 (×10)
    const avgStepScore100 =
        Number.isFinite(Number(stats?.avgStepScore))
            ? Math.max(0, Math.min(100, Number(stats.avgStepScore) * 10))
            : null;

    return (
        <Row className="g-3">
            <Col lg="4">
                <Card className="shadow-sm h-100">
                    <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Steps</div>

                        <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #e9ecef', borderRadius: 8, padding: 8 }}>
                            {stepsLoading && (
                                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                    <Spinner size="sm" /> <span>Loading steps…</span>
                                </div>
                            )}

                            {!stepsLoading && stepsErr && steps.length === 0 && (
                                <div className="text-danger" style={{ fontSize: 12 }}>{stepsErr}</div>
                            )}

                            {!stepsLoading && !stepsErr && steps.length === 0 && (
                                <div className="text-muted" style={{ fontSize: 12 }}>No steps.</div>
                            )}

                            {steps.map(s => {
                                const active = s.id === selectedStepId;
                                return (
                                    <Button
                                        key={s.id}
                                        onClick={() => { setSelectedStepId(s.id); onSelectStep?.(s.id); }}
                                        className={`w-100 text-start ${active ? 'btn-secondary' : 'btn-light'}`}
                                        style={{ marginBottom: 6, borderRadius: 8 }}
                                    >
                                        <div className="d-flex align-items-center justify-content-between">
                                            <span style={{ fontWeight: active ? 600 : 500 }}>{s.title}</span>
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>
                    </CardBody>
                </Card>
            </Col>

            <Col lg="8">
                {!selectedStepId && (
                    <Card className="shadow-sm">
                        <CardBody>
                            <div className="text-muted">Select a step to see analytics.</div>
                        </CardBody>
                    </Card>
                )}

                {selectedStepId && (
                    <Card className="shadow-sm">
                        <CardBody>
                            {/* NEW: Header like in Question */}
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>
                                Step:{' '}
                                <span style={{ fontWeight: 600 }}>
                                    {selectedStep?.title ?? `#${selectedStepId}`}
                                </span>
                            </div>

                            {loading && (
                                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                    <Spinner size="sm" /> <span>Loading step analytics…</span>
                                </div>
                            )}
                            {err && <div className="text-danger">Error: {err}</div>}

                            {stats && (
                                <>
                                    <Row className="g-3">
                                        <Col md="6"><Kpi title="Candidates with score ≥ 50%" value={passValue} /></Col>
                                        <Col md="6">
                                            <Kpi
                                                title="Avg Step Score (0–100)"
                                                value={avgStepScore100 != null ? avgStepScore100.toFixed(1) : '—'}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="g-3 mt-1">
                                        <Col md="12">
                                            <StepScoreHistogram buckets={stats.scoreDistribution ?? []} />
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
