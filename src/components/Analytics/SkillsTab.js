import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, CardBody, Spinner, Button } from 'reactstrap';

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

const fmtPct = (n) => (Number.isFinite(+n) ? `${(+n).toFixed(1)}%` : '—');
const val = (...cands) => cands.find((x) => x !== undefined && x !== null);

/* --- Histogram --- */
function Histogram({ buckets }) {
    const mapped = (Array.isArray(buckets) ? buckets : []).map((b, i) => {
        const from = b.from ?? i * 10;
        const rawTo = b.to ?? (i + 1) * 10;
        const to = rawTo === 100 ? 100 : rawTo - 1;
        return { label: `${from}-${to}`, value: Number(b.count ?? b.cnt ?? b.value ?? 0) };
    });

    const max = Math.max(1, ...mapped.map((x) => x.value));
    const total = mapped.reduce((s, x) => s + x.value, 0);

    return (
        <div>
            <div className="mb-2" style={{ fontWeight: 600 }}>Score Distribution (0–100)</div>
            <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 6 }}>
                Each bar = candidates in that score range
            </div>
            <div
                className="d-flex align-items-end"
                style={{ gap: 10, height: 150, padding: '8px 6px', border: '1px solid #eee', borderRadius: 8, background: '#fff' }}
            >
                {mapped.map((b, i) => {
                    const hPx = (b.value / max) * 120;
                    const pct = total > 0 ? `${((b.value / total) * 100).toFixed(1)}%` : '0%';
                    return (
                        <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <div style={{ fontSize: 10, opacity: 0.85, marginBottom: 4 }}>{pct}</div>
                                <div
                                    style={{ height: `${hPx}px`, background: '#e5e7eb', borderRadius: 6, width: '100%' }}
                                    title={`${b.label}: ${b.value} (${pct})`}
                                />
                            </div>
                            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{b.label.replace('–', '-')}</div>
                        </div>
                    );
                })}
                {mapped.length === 0 && <div className="text-muted" style={{ fontSize: 12 }}>—</div>}
            </div>
        </div>
    );
}

async function fetchJsonSafe(url) {
    try {
        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
    } catch {
        return null;
    }
}

/* ---------- MAIN ---------- */
export default function SkillsTab({
    apiBase = process.env.REACT_APP_BASE_URL+'/api',
    jobAdId,
    questionId,
    selectedSkillId,
    onSelectSkill,
}) {
    const [skills, setSkills] = useState([]);
    const [skillsLoading, setSkillsLoading] = useState(false);
    const [skillsErr, setSkillsErr] = useState('');

    const [internalSkillId, setInternalSkillId] = useState(null);
    const effectiveSkillId = selectedSkillId ?? internalSkillId;

    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsErr, setStatsErr] = useState('');

    const selectedSkill = useMemo(
        () => skills.find((s) => s.id === effectiveSkillId) || null,
        [skills, effectiveSkillId]
    );

    useEffect(() => {
        setInternalSkillId(null);
        setStats(null);
    }, [questionId]);

    // 1) skills for question
    useEffect(() => {
        if (!questionId) {
            setSkills([]);
            return;
        }
        let ignore = false;
        setSkillsLoading(true);
        setSkillsErr('');
        fetchJsonSafe(`${apiBase}/statistics/question/${questionId}/skills`)
            .then((j) => {
                if (ignore) return;
                if (!j) {
                    setSkillsErr('Could not load skills for this question.');
                    setSkills([]);
                    return;
                }
                const arr = Array.isArray(j) ? j : [];
                const norm = arr
                    .map((s) => ({
                        id: s.id ?? s.skillId ?? s.sid,
                        title: s.title ?? s.name ?? s.skill ?? `Skill ${s.id ?? ''}`,
                    }))
                    .filter((x) => x.id != null);
                setSkills(norm);
            })
            .finally(() => {
                if (!ignore) setSkillsLoading(false);
            });
        return () => { ignore = true; };
    }, [apiBase, questionId]);

    // 2) analytics per skill (scoped αν έχουμε jobAdId + questionId)
    useEffect(() => {
        if (!effectiveSkillId) {
            setStats(null);
            return;
        }
        let ignore = false;
        setStatsLoading(true);
        setStatsErr('');

        const url = (jobAdId && questionId)
            ? `${apiBase}/statistics/jobad/${jobAdId}/question/${questionId}/skill/${effectiveSkillId}`
            : `${apiBase}/statistics/skill/${effectiveSkillId}`;

        fetch(url, { headers: { Accept: 'application/json' } })
            .then(async (r) => {
                if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`));
                return r.json();
            })
            .then((j) => { if (!ignore) setStats(j); })
            .catch((e) => { if (!ignore) setStatsErr(String(e.message || e)); })
            .finally(() => { if (!ignore) setStatsLoading(false); });
        return () => { ignore = true; };
    }, [apiBase, jobAdId, questionId, effectiveSkillId]);

    const avgSkillScore = val(stats?.avgSkillScore, stats?.avg_score, stats?.avgScore);
    const passRate = val(stats?.passRate, stats?.pass_rate);
    const distribution = stats?.distribution ?? [];

    const chooseSkill = (id) => {
        if (onSelectSkill) onSelectSkill(id);
        else setInternalSkillId(id);
    };

    // Avg in 0–100
    const avgSkillScore100 =
        Number.isFinite(+avgSkillScore) ? Math.max(0, Math.min(100, +avgSkillScore * 10)) : null;

    // value for "Candidates with score ≥ 50%": passed/total (XX.X%)
    const passValue = (() => {
        if (!stats) return '—';
        const rate = Number(passRate);
        const buckets = Array.isArray(distribution) ? distribution : [];

        // χρησιμοποίησε απευθείας αν υπάρχουν
        const totalDto = Number(stats?.totalCount);
        const passDto = Number(stats?.passCount);
        if (Number.isFinite(totalDto) && totalDto > 0 && Number.isFinite(passDto)) {
            const pctText = Number.isFinite(rate) ? `(${rate.toFixed(1)}%)` : '';
            return (
                <>
                    <span>{passDto}/{totalDto}</span>
                    {pctText && (
                        <span style={{ marginLeft: 8, fontWeight: 500, fontSize: 18, color: '#6c757d' }}>
                            {pctText}
                        </span>
                    )}
                </>
            );
        }

        // αλλιώς derive από buckets/rate
        const total = buckets.reduce((a, b) => a + (Number(b.count) || 0), 0);
        let passCount = buckets.reduce((a, b, i) => {
            const from = Number(b?.from ?? i * 10);
            return a + (from >= 50 ? (Number(b.count) || 0) : 0);
        }, 0);
        if (!Number.isFinite(passCount) && Number.isFinite(rate) && total > 0) {
            passCount = Math.round((rate / 100) * total);
        }
        if (!(Number.isFinite(passCount) && total > 0)) return fmtPct(rate);

        const pctText = Number.isFinite(rate) ? `(${rate.toFixed(1)}%)` : '';
        return (
            <>
                <span>{passCount}/{total}</span>
                {pctText && (
                    <span style={{ marginLeft: 8, fontWeight: 500, fontSize: 18, color: '#6c757d' }}>
                        {pctText}
                    </span>
                )}
            </>
        );
    })();

    return (
        <div className="steps-tab-wrap q-col-flex q-no-x">
            <Row className="q-fill gx-3 gy-tight">
                {/* Λίστα δεξιοτήτων */}
                <Col md="4" className="q-col-flex">
                    <Card className="shadow-sm q-card-fill">
                        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>Skills</div>

                            <div
                                style={{
                                    flex: '1 1 auto',
                                    minHeight: 0,
                                    overflow: 'auto',
                                    border: '1px solid #e9ecef',
                                    borderRadius: 8,
                                    padding: 8,
                                }}
                            >
                                {skillsLoading && (
                                    <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                        <Spinner size="sm" /> <span>Loading…</span>
                                    </div>
                                )}
                                {!skillsLoading && skillsErr && (
                                    <div className="text-danger" style={{ fontSize: 12 }}>{skillsErr}</div>
                                )}
                                {!skillsLoading && !skillsErr && skills.length === 0 && (
                                    <div className="text-muted" style={{ fontSize: 12 }}>No skills for this question.</div>
                                )}

                                {skills.map((s) => {
                                    const active = s.id === effectiveSkillId;
                                    return (
                                        <Button
                                            key={s.id}
                                            onClick={() => chooseSkill(s.id)}
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

                {/* Analytics δεξιότητας */}
                <Col md="8" className="q-col-flex">
                    <Card className="shadow-sm q-card-fill">
                        <div style={{ padding: '1rem 1rem 0 1rem' }}>
                            {!effectiveSkillId && <div className="text-muted">Select a skill to see its analytics.</div>}
                            {effectiveSkillId && (
                                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                                    Skill: <span style={{ fontWeight: 600 }}>{selectedSkill?.title ?? `#${effectiveSkillId}`}</span>
                                </div>
                            )}
                        </div>

                        <CardBody className="q-card-body-scroll">
                            {effectiveSkillId && (
                                <>
                                    {statsLoading && (
                                        <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                            <Spinner size="sm" /> Loading…
                                        </div>
                                    )}
                                    {statsErr && <div className="text-danger">Error: {statsErr}</div>}

                                    {!statsLoading && !statsErr && stats && (
                                        <>
                                            <Row className="g-3">
                                                <Col md="6">
                                                    <Kpi
                                                        title="Avg Skill Score (0–100)"
                                                        value={avgSkillScore100 != null ? avgSkillScore100.toFixed(1) : '—'}
                                                    />
                                                </Col>
                                                <Col md="6">
                                                    <Kpi title="Candidates with score ≥ 50%" value={passValue} />
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
        </div>
    );
}
