import React, { useEffect, useMemo, useState } from 'react';
import {
    Row,
    Col,
    Card,
    CardBody,
    Spinner,
    Button,
    ListGroup,
    ListGroupItem,
} from 'reactstrap';

/* ---------- Small UI bits ---------- */
const Kpi = ({ title, value, sub }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
            <div className="metric-number">{value}</div>
            {sub && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{sub}</div>}
        </CardBody>
    </Card>
);

const fmt1 = (n) => (Number.isFinite(+n) ? (+n).toFixed(1) : '—');
const fmtPct = (n) => (Number.isFinite(+n) ? `${(+n).toFixed(1)}%` : '—');
const val = (...cands) => cands.find((x) => x !== undefined && x !== null);

/* Histogram (ίδιο με πριν) */
function Histogram({ buckets }) {
    const mapped = (Array.isArray(buckets) ? buckets : []).map((b, i) => {
        const from = b.from ?? i * 10;
        const rawTo = b.to ?? (i + 1) * 10;
        const to = rawTo === 100 ? 100 : rawTo - 1; // => 0-9, 10-19, …, 90–100
        return {
            label: `${from}-${to}`,
            value: Number(b.count ?? b.cnt ?? b.value ?? 0),
        };
    });

    const max = Math.max(1, ...mapped.map((x) => x.value));
    const total = mapped.reduce((s, x) => s + x.value, 0);

    return (
        <div>
            <div className="mb-2" style={{ fontWeight: 600 }}>
                Score Distribution (0–100)
            </div>
            {/* μικρή περιγραφή */}
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
                {mapped.map((b, i) => {
                    const hPx = (b.value / max) * 120;
                    const pct = total > 0 ? `${((b.value / total) * 100).toFixed(1)}%` : '0%';
                    return (
                        <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                            {/* ποσοστό επάνω από τη μπάρα */}
                            <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <div style={{ fontSize: 10, opacity: 0.85, marginBottom: 4 }}>{pct}</div>
                                <div
                                    style={{ height: `${hPx}px`, background: '#e5e7eb', borderRadius: 6, width: '100%' }}
                                    title={`${b.label}: ${b.value} (${pct})`}
                                />
                            </div>
                            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                                {b.label.replace('–', '-')}
                            </div>
                        </div>
                    );
                })}
                {mapped.length === 0 && <div className="text-muted" style={{ fontSize: 12 }}>—</div>}
            </div>
        </div>
    );
}

/* Endpoints: προτεραιότητα στο jobAd+step, μετά τα fallback */
const QUESTION_LIST_ENDPOINTS = (base, jobAdId, stepId) => [
    `${base}/statistics/jobad/${jobAdId}/step/${stepId}/questions`,
    `${base}/steps/${stepId}/questions`,
    `${base}/questions/step/${stepId}`,
];

async function tryFetchJson(url) {
    try {
        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
    } catch {
        return null;
    }
}

/* ===================== COMPONENT ===================== */
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
        () => questions.find((q) => q.id === selectedQuestionId) || null,
        [questions, selectedQuestionId]
    );

    /* Φέρε τις ερωτήσεις του step */
    useEffect(() => {
        if (!stepId || !jobAdId) {
            setQuestions([]);
            return;
        }
        let ignore = false;
        setQLoading(true);
        setQErr('');
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
                    const norm = arr
                        .map((q) => ({
                            id: q.id ?? q.questionId ?? q.qid,
                            title: q.title ?? q.name ?? q.question ?? `Question ${q.id ?? ''}`,
                        }))
                        .filter((x) => x.id != null);
                    setQuestions(norm);
                }
            }
        })().finally(() => {
            if (!ignore) setQLoading(false);
        });
        return () => {
            ignore = true;
        };
    }, [apiBase, jobAdId, stepId]);

    /* Φέρε analytics ερώτησης */
    useEffect(() => {
        if (!jobAdId || !selectedQuestionId) {
            setStats(null);
            return;
        }
        let ignore = false;
        setStatsLoading(true);
        setStatsErr('');
        fetch(`${apiBase}/statistics/jobad/${jobAdId}/question/${selectedQuestionId}`, {
            headers: { Accept: 'application/json' },
        })
            .then(async (r) => {
                if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`));
                return r.json();
            })
            .then((j) => {
                if (!ignore) setStats(j);
            })
            .catch((e) => {
                if (!ignore) setStatsErr(String(e.message || e));
            })
            .finally(() => {
                if (!ignore) setStatsLoading(false);
            });
        return () => {
            ignore = true;
        };
    }, [apiBase, jobAdId, selectedQuestionId]);

    const avgScore = val(stats?.avgQuestionScore, stats?.avg_score, stats?.avgScore);
    const passRate = val(stats?.passRate, stats?.pass_rate);
    const distribution = stats?.distribution ?? [];
    const skillRanking = Array.isArray(stats?.skillRanking) ? stats.skillRanking : [];

    // --- μετατροπή Avg Question Score σε 0–100 για εμφάνιση ---
    const avgScore100 =
        Number.isFinite(+avgScore) ? Math.max(0, Math.min(100, +avgScore * 10)) : null;

    // --- NEW: value για το KPI "Score ≥ 50%" σε μορφή passed/total (XX.X%) ---
    const passValue = (() => {
        if (!stats) return '—';
        const rate = Number(passRate);
        const buckets = Array.isArray(distribution) ? distribution : [];
        const total = buckets.reduce((a, b) => a + (Number(b.count) || 0), 0);

        let passCount = Number(stats?.passCount);
        if (!Number.isFinite(passCount)) {
            passCount = buckets.reduce((a, b, i) => {
                const from = Number(b?.from ?? i * 10);
                return a + (from >= 50 ? (Number(b.count) || 0) : 0);
            }, 0);
            if (!Number.isFinite(passCount) && Number.isFinite(rate) && total > 0) {
                passCount = Math.round((rate / 100) * total);
            }
        }

        if (!(Number.isFinite(passCount) && total > 0)) return fmtPct(rate);

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

    return (
        <Row className="g-3">
            {/* LISTA ΕΡΩΤΗΣΕΩΝ — ίδιο στυλ με Steps/Candidates (buttons) */}
            <Col md="4">
                <Card className="shadow-sm h-100">
                    <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Questions</div>

                        <div
                            style={{
                                maxHeight: 260,
                                overflow: 'auto',
                                border: '1px solid #e9ecef',
                                borderRadius: 8,
                                padding: 8,
                            }}
                        >
                            {qLoading && (
                                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                    <Spinner size="sm" /> <span>Loading questions…</span>
                                </div>
                            )}
                            {!qLoading && qErr && (
                                <div className="text-danger" style={{ fontSize: 12 }}>
                                    {qErr}
                                </div>
                            )}
                            {!qLoading && !qErr && questions.length === 0 && (
                                <div className="text-muted" style={{ fontSize: 12 }}>
                                    No questions for this step.
                                </div>
                            )}

                            {questions.map((q) => {
                                const active = q.id === selectedQuestionId;
                                return (
                                    <Button
                                        key={q.id}
                                        onClick={() => onSelectQuestion?.(q.id)}
                                        className={`w-100 text-start ${active ? 'btn-secondary' : 'btn-light'}`}
                                        style={{ marginBottom: 6 }}
                                    >
                                        {q.title}
                                    </Button>
                                );
                            })}
                        </div>
                    </CardBody>
                </Card>
            </Col>

            {/* ANALYTICS ΕΡΩΤΗΣΗΣ */}
            <Col md="8">
                <Card className="shadow-sm h-100">
                    <CardBody>
                        {!selectedQuestionId && (
                            <div className="text-muted">Select a question to see its analytics.</div>
                        )}

                        {selectedQuestionId && (
                            <>
                                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                                    Question:{' '}
                                    <span style={{ fontWeight: 600 }}>
                                        {selectedQuestion?.title ?? `#${selectedQuestionId}`}
                                    </span>
                                </div>

                                {statsLoading && (
                                    <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                        <Spinner size="sm" /> <span>Loading…</span>
                                    </div>
                                )}
                                {statsErr && <div className="text-danger">Error: {statsErr}</div>}

                                {!statsLoading && !statsErr && stats && (
                                    <>
                                        {/* 1η γραμμή: Avg, Pass Rate, Skill Ranking */}
                                        <Row className="g-3">
                                            <Col md="4">
                                                {/* τίτλος + τιμή σε 0–100 */}
                                                <Kpi
                                                    title="Avg Question Score (0–100)"
                                                    value={avgScore100 != null ? avgScore100.toFixed(1) : '—'}
                                                />
                                            </Col>
                                            <Col md="4">
                                                <Kpi title="Candidates with score ≥ 50%" value={passValue} />
                                            </Col>
                                            <Col md="4">
                                                <Card className="shadow-sm h-100">
                                                    <CardBody>
                                                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Skill Ranking</div>
                                                        <ListGroup flush>
                                                            {(skillRanking.length ? skillRanking : []).map((s) => (
                                                                <ListGroupItem
                                                                    key={s.skill}
                                                                    className="d-flex align-items-center justify-content-between"
                                                                >
                                                                    <span>{s.skill}</span>
                                                                    <strong>{fmt1(s.avgScore ?? s.averageScore ?? s.avg_score)}</strong>
                                                                </ListGroupItem>
                                                            ))}
                                                            {skillRanking.length === 0 && (
                                                                <ListGroupItem className="text-muted">—</ListGroupItem>
                                                            )}
                                                        </ListGroup>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {/* Histogram */}
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
