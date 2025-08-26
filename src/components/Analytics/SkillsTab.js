import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner } from 'reactstrap';

/* ---------- Shared list styles (ίδια λογική με Steps/Questions) ---------- */
const LIST_CSS = `
.selectable-list .list-group-item {
  border: none;
  margin-bottom: 8px;
  border-radius: 10px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all .15s ease;
}
.selectable-list .list-group-item:hover {
  background: #f1f3f5;
}
.selectable-list .list-group-item.active {
  background: #495057 !important;   /* σκούρο γκρι */
  color: #fff !important;
  font-weight: 600;
}
`;

/* ---------- Small UI bits (ίδια με QuestionsTab) ---------- */
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
            <div className="d-flex align-items-end"
                style={{ gap: 10, height: 150, padding: '8px 6px', border: '1px solid #eee', borderRadius: 8, background: '#fff' }}>
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
    apiBase = 'http://localhost:8087/api',
    questionId,
    selectedSkillId,     // προαιρετικό (controlled)
    onSelectSkill,       // προαιρετικό
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
        () => skills.find(s => s.id === effectiveSkillId) || null,
        [skills, effectiveSkillId]
    );

    // Reset επιλογής όταν αλλάζει ερώτηση
    useEffect(() => {
        setInternalSkillId(null);
        setStats(null);
    }, [questionId]);

    // 1) Φέρε δεξιότητες για την ερώτηση
    useEffect(() => {
        if (!questionId) { setSkills([]); return; }
        let ignore = false;
        setSkillsLoading(true); setSkillsErr('');
        fetchJsonSafe(`${apiBase}/statistics/question/${questionId}/skills`)
            .then((j) => {
                if (ignore) return;
                if (!j) { setSkillsErr('Could not load skills for this question.'); setSkills([]); return; }
                const arr = Array.isArray(j) ? j : [];
                const norm = arr.map(s => ({
                    id: s.id ?? s.skillId ?? s.sid,
                    title: s.title ?? s.name ?? s.skill ?? `Skill ${s.id ?? ''}`,
                })).filter(x => x.id != null);
                setSkills(norm);
            })
            .finally(() => { if (!ignore) setSkillsLoading(false); });
        return () => { ignore = true; };
    }, [apiBase, questionId]);

    // 2) Φέρε analytics δεξιότητας (global)
    useEffect(() => {
        if (!effectiveSkillId) { setStats(null); return; }
        let ignore = false;
        setStatsLoading(true); setStatsErr('');
        fetch(`${apiBase}/statistics/skill/${effectiveSkillId}`, { headers: { Accept: 'application/json' } })
            .then(async (r) => { if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`)); return r.json(); })
            .then((j) => { if (!ignore) setStats(j); })
            .catch((e) => { if (!ignore) setStatsErr(String(e.message || e)); })
            .finally(() => { if (!ignore) setStatsLoading(false); });
        return () => { ignore = true; };
    }, [apiBase, effectiveSkillId]);

    const avgSkillScore = val(stats?.avgSkillScore, stats?.avg_score, stats?.avgScore);
    const passRate = val(stats?.passRate, stats?.pass_rate);
    const distribution = stats?.distribution ?? [];

    const chooseSkill = (id) => {
        if (onSelectSkill) onSelectSkill(id);
        else setInternalSkillId(id);
    };

    return (
        <>
            {/* CSS override για τα items της λίστας */}
            <style>{LIST_CSS}</style>

            <Row className="g-3">
                {/* Λίστα δεξιοτήτων (button-like items) */}
                <Col md="4">
                    <Card className="shadow-sm h-100">
                        <CardBody>
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>Skills</div>
                            {skillsLoading && (
                                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                    <Spinner size="sm" /> Loading…
                                </div>
                            )}
                            {skillsErr && <div className="text-danger">{skillsErr}</div>}
                            {!skillsLoading && !skillsErr && (
                                <ListGroup flush className="selectable-list">
                                    {skills.length === 0 && (
                                        <ListGroupItem className="text-muted">No skills for this question.</ListGroupItem>
                                    )}
                                    {skills.map((s) => (
                                        <ListGroupItem
                                            key={s.id}
                                            active={effectiveSkillId === s.id}
                                            onClick={() => chooseSkill(s.id)}
                                        >
                                            {s.title}
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            )}
                        </CardBody>
                    </Card>
                </Col>

                {/* Analytics δεξιότητας */}
                <Col md="8">
                    <Card className="shadow-sm h-100">
                        <CardBody>
                            {!effectiveSkillId && <div className="text-muted">Select a skill to see its analytics.</div>}

                            {effectiveSkillId && (
                                <>
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                                        Skill: <span style={{ fontWeight: 600 }}>{selectedSkill?.title ?? `#${effectiveSkillId}`}</span>
                                    </div>

                                    {statsLoading && (
                                        <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                            <Spinner size="sm" /> Loading…
                                        </div>
                                    )}
                                    {statsErr && <div className="text-danger">Error: {statsErr}</div>}

                                    {!statsLoading && !statsErr && stats && (
                                        <>
                                            <Row className="g-3">
                                                <Col md="6"><Kpi title="Avg Skill Score" value={fmt1(avgSkillScore)} sub="0–10" /></Col>
                                                <Col md="6"><Kpi title="Pass Rate" value={fmtPct(passRate)} sub="Score ≥ 50%" /></Col>
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
        </>
    );
}
