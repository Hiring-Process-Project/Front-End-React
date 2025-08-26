import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner } from 'reactstrap';

/* UI helpers */
const Kpi = ({ title, value, sub }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
            {sub && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{sub}</div>}
        </CardBody>
    </Card>
);

const fmt1 = (n) => (Number.isFinite(+n) ? (+n).toFixed(1) : '—');
const fmtPct = (n) => (Number.isFinite(+n) ? `${(+n).toFixed(1)}%` : '—');
const val = (...cands) => cands.find((x) => x !== undefined && x !== null);

function Histogram({ buckets }) {
    const mapped = (Array.isArray(buckets) ? buckets : []).map((b, i) => ({
        label: b.range ?? `${b.from ?? i * 10}–${b.to ?? (i === 9 ? 100 : (i + 1) * 10)}`,
        value: Number(b.count ?? b.cnt ?? b.value ?? 0),
    }));
    const max = Math.max(1, ...mapped.map((x) => x.value));
    return (
        <div>
            <div className="mb-2" style={{ fontWeight: 600 }}>Score Distribution (0–100)</div>
            <div className="d-flex align-items-end" style={{ gap: 10, height: 150, padding: '8px 6px', border: '1px solid #eee', borderRadius: 8, background: '#fff' }}>
                {mapped.map((b, i) => (
                    <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                        <div
                            style={{ height: `${(b.value / max) * 120}px`, background: '#e5e7eb', borderRadius: 6 }}
                            title={`${b.label}: ${b.value}`}
                        />
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{b.label.replace('–', '-')}</div>
                    </div>
                ))}
                {mapped.length === 0 && <div className="text-muted" style={{ fontSize: 12 }}>—</div>}
            </div>
        </div>
    );
}

/** Προτεραιοποιούμε το νέο backend endpoint (jobAd + step),
 *  κρατάμε και τα παλιά σαν fallback αν υπάρχουν στο project.
 */
const QUESTION_LIST_ENDPOINTS = (base, jobAdId, stepId) => ([
    `${base}/statistics/jobad/${jobAdId}/step/${stepId}/questions`, // <-- ΝΕΟ
    `${base}/steps/${stepId}/questions`,                            // fallback A
    `${base}/questions/step/${stepId}`,                             // fallback B
]);

async function tryFetchJson(url) {
    try {
        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
    } catch (e) {
        return null;
    }
}

export default function QuestionsTab({
    apiBase = 'http://localhost:8087/api',
    jobAdId,
    stepId,
    selectedQuestionId,
    onSelectQuestion,
}) {
    const [qLoading, setQLoading] = useState(false);
    const [qErr, setQErr] = useState('');
    const [questions, setQuestions] = useState([]);

    const [statsLoading, setStatsLoading] = useState(false);
    const [statsErr, setStatsErr] = useState('');
    const [stats, setStats] = useState(null);

    const selectedQuestion = useMemo(
        () => questions.find(q => q.id === selectedQuestionId) || null,
        [questions, selectedQuestionId]
    );

    // 1) Φέρε τις ερωτήσεις για το συγκεκριμένο step
    useEffect(() => {
        if (!stepId || !jobAdId) { setQuestions([]); return; }
        let ignore = false;
        setQLoading(true); setQErr('');
        (async () => {
            const urls = QUESTION_LIST_ENDPOINTS(apiBase, jobAdId, stepId);
            let got = null;
            for (const u of urls) {
                got = await tryFetchJson(u);
                if (got) break;
            }
            if (!ignore) {
                if (!got) {
                    setQErr('Could not load questions for this step.');
                    setQuestions([]);
                } else {
                    const arr = Array.isArray(got) ? got : [];
                    const norm = arr.map(q => ({
                        id: q.id ?? q.questionId ?? q.qid,
                        title: q.title ?? q.name ?? q.question ?? `Question ${q.id ?? ''}`,
                    })).filter(x => x.id != null);
                    setQuestions(norm);
                }
            }
        })().finally(() => { if (!ignore) setQLoading(false); });
        return () => { ignore = true; };
    }, [apiBase, jobAdId, stepId]);

    // 2) Όταν επιλέγεται ερώτηση, φέρε τα analytics της
    useEffect(() => {
        if (!jobAdId || !selectedQuestionId) { setStats(null); return; }
        let ignore = false;
        setStatsLoading(true); setStatsErr('');
        const url = `${apiBase}/statistics/jobad/${jobAdId}/question/${selectedQuestionId}`;
        fetch(url, { headers: { Accept: 'application/json' } })
            .then(async (r) => { if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`)); return r.json(); })
            .then((j) => { if (!ignore) setStats(j); })
            .catch((e) => { if (!ignore) setStatsErr(String(e.message || e)); })
            .finally(() => { if (!ignore) setStatsLoading(false); });
        return () => { ignore = true; };
    }, [apiBase, jobAdId, selectedQuestionId]);

    const avgScore = val(stats?.avgQuestionScore, stats?.avg_score, stats?.avgScore);
    const passRate = val(stats?.passRate, stats?.pass_rate);
    const distribution = stats?.distribution ?? [];

    const bestSkill = stats?.bestSkill
        ? {
            name: stats.bestSkill.skill ?? stats.bestSkill.title ?? stats.bestSkill.name,
            score: val(stats.bestSkill.avgScore, stats.bestSkill.averageScore, stats.bestSkill.avg_score),
        }
        : null;

    const worstSkill = stats?.worstSkill
        ? {
            name: stats.worstSkill.skill ?? stats.worstSkill.title ?? stats.worstSkill.name,
            score: val(stats.worstSkill.avgScore, stats.worstSkill.averageScore, stats.worstSkill.avg_score),
        }
        : null;

    return (
        <Row className="g-3">
            {/* Λίστα ερωτήσεων */}
            <Col md="4">
                <Card className="shadow-sm h-100">
                    <CardBody>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Questions</div>
                        {qLoading && <div className="d-flex align-items-center" style={{ gap: 8 }}><Spinner size="sm" /> Loading…</div>}
                        {qErr && <div className="text-danger">{qErr}</div>}
                        {!qLoading && !qErr && (
                            <ListGroup flush>
                                {questions.length === 0 && <ListGroupItem className="text-muted">No questions for this step.</ListGroupItem>}
                                {questions.map((q) => (
                                    <ListGroupItem
                                        key={q.id}
                                        active={selectedQuestionId === q.id}
                                        onClick={() => onSelectQuestion && onSelectQuestion(q.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {q.title}
                                    </ListGroupItem>
                                ))}
                            </ListGroup>
                        )}
                    </CardBody>
                </Card>
            </Col>

            {/* Analytics ερώτησης */}
            <Col md="8">
                <Card className="shadow-sm h-100">
                    <CardBody>
                        {!selectedQuestionId && <div className="text-muted">Select a question to see its analytics.</div>}
                        {selectedQuestionId && (
                            <>
                                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                                    Question: <span style={{ fontWeight: 600 }}>{selectedQuestion?.title ?? `#${selectedQuestionId}`}</span>
                                </div>
                                {statsLoading && <div className="d-flex align-items-center" style={{ gap: 8 }}><Spinner size="sm" /> Loading…</div>}
                                {statsErr && <div className="text-danger">Error: {statsErr}</div>}
                                {!statsLoading && !statsErr && stats && (
                                    <>
                                        <Row className="g-3">
                                            <Col md="6"><Kpi title="Avg Question Score" value={fmt1(avgScore)} sub="0–10" /></Col>
                                            <Col md="6"><Kpi title="Pass Rate" value={fmtPct(passRate)} sub="Score ≥ 50%" /></Col>
                                        </Row>

                                        <Row className="g-3 mt-1">
                                            <Col md="6">
                                                <Card className="shadow-sm h-100">
                                                    <CardBody>
                                                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Best Skill</div>
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <span>{bestSkill?.name ?? '—'}</span>
                                                            <strong>{bestSkill ? fmt1(bestSkill.score) : '—'}</strong>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md="6">
                                                <Card className="shadow-sm h-100">
                                                    <CardBody>
                                                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Worst Skill</div>
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <span>{worstSkill?.name ?? '—'}</span>
                                                            <strong>{worstSkill ? fmt1(worstSkill.score) : '—'}</strong>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>

                                        <Row className="g-3 mt-1">
                                            <Col md="12">
                                                <Card className="shadow-sm h-100">
                                                    <CardBody>
                                                        <Histogram buckets={distribution} />
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </>
                                )}
                            </>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}
