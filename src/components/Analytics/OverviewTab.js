import React, { useEffect, useMemo, useState } from 'react';
import {
    Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner,
} from 'reactstrap';

/* ---------- Small UI bits ---------- */
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

/* Segmented bar: Approved / Rejected / Other */
function SegmentedBar({ approved = 0, rejected = 0 }) {
    const ap = Math.max(0, Math.min(100, +approved || 0));
    const rj = Math.max(0, Math.min(100, +rejected || 0));
    const other = Math.max(0, 100 - ap - rj);
    return (
        <div>
            <div className="mb-2" style={{ fontWeight: 600 }}>Approval vs Rejection</div>
            <div className="d-flex justify-content-between" style={{ fontSize: 12, opacity: 0.8 }}>
                <span>Approved {fmtPct(ap)}</span>
                <span>Rejected {fmtPct(rj)}</span>
                <span>Other {fmtPct(other)}</span>
            </div>
            <div
                style={{
                    height: 18,
                    background: '#e9ecef',
                    borderRadius: 10,
                    overflow: 'hidden',
                    marginTop: 6,
                }}
            >
                <div style={{ width: `${ap}%`, height: '100%', background: '#3b82f6', display: 'inline-block' }} />
                <div style={{ width: `${rj}%`, height: '100%', background: '#ef4444', display: 'inline-block' }} />
                <div style={{ width: `${other}%`, height: '100%', background: '#6b7280', display: 'inline-block' }} />
            </div>
        </div>
    );
}

/* Vertical mini-histogram 0–100 */
function Histogram({ buckets }) {
    // buckets: [{from,to,count|cnt|value} or {range, count}]
    const mapped = (Array.isArray(buckets) ? buckets : []).map((b, i) => ({
        label:
            b.range ??
            `${b.from ?? i * 10}–${b.to ?? (i === 9 ? 100 : (i + 1) * 10)}`,
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
                            style={{
                                height: `${(b.value / max) * 120}px`,
                                background: '#e5e7eb',
                                borderRadius: 6,
                            }}
                            title={`${b.label}: ${b.value}`}
                        />
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{b.label.replace('–', '-')}</div>
                    </div>
                ))}
                {mapped.length === 0 && (
                    <div className="text-muted" style={{ fontSize: 12 }}>—</div>
                )}
            </div>
        </div>
    );
}

/* Ranked list (lower = harder) */
function RankedList({ title, items, leftKey = 'label', rightKey = 'value', hintLowerHarder = true }) {
    const list = (Array.isArray(items) ? items : []);
    return (
        <Card className="shadow-sm h-100">
            <CardBody>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {title} {hintLowerHarder && <span style={{ fontSize: 12, opacity: 0.6 }}>(lower = harder)</span>}
                </div>
                <ListGroup flush>
                    {list.length === 0 && <ListGroupItem className="text-muted">—</ListGroupItem>}
                    {list.map((it, i) => (
                        <ListGroupItem key={`${leftKey}-${i}`} className="d-flex align-items-center justify-content-between">
                            <span>{it[leftKey]}</span>
                            <strong>{fmt1(it[rightKey])}</strong>
                        </ListGroupItem>
                    ))}
                </ListGroup>
            </CardBody>
        </Card>
    );
}

/* ---------- DATA FETCH ---------- */
const urlFor = (level, data, base) => {
    switch (level) {
        case 'jobAd':
            return `${base}/statistics/jobad/${data?.id ?? data?.jobAdId}`;
        case 'department':
            return `${base}/statistics/department/${data?.id ?? data?.departmentId}`;
        case 'occupation':
            return `${base}/statistics/occupation/${data?.departmentId}/${data?.id ?? data?.occupationId}`;
        case 'organization':
        default:
            return `${base}/statistics/organization/${data?.orgId ?? 3}`;
    }
};

export default function OverviewTab({ level, data, base = 'http://localhost:8087/api' }) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [stats, setStats] = useState(null);

    const fetchUrl = useMemo(() => urlFor(level, data, base), [level, data, base]);

    useEffect(() => {
        if (!fetchUrl) { setStats(null); return; }
        let ignore = false;
        setLoading(true); setErr('');
        fetch(fetchUrl, { headers: { Accept: 'application/json' } })
            .then(async (r) => {
                if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`));
                return r.json();
            })
            .then((j) => { if (!ignore) setStats(j); })
            .catch((e) => { if (!ignore) setErr(String(e.message || e)); })
            .finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [fetchUrl]);

    if (loading) {
        return <div className="d-flex align-items-center" style={{ gap: 8 }}><Spinner size="sm" /> Loading…</div>;
    }
    if (err) return <div className="text-danger">Error: {err}</div>;
    if (!stats) return null;

    /* ---------- JOB AD (όπως το ωραίο mock) ---------- */
    if (level === 'jobAd') {
        const approvalRate = val(stats.approvalRate, stats.approval_rate);
        const rejectionRate = val(stats.rejectionRate, stats.rejection_rate);
        const hireRate = val(stats.hireRate, stats.hire_rate);
        const avgCandidateScore = val(stats.avgCandidateScore, stats.avg_score, stats.averageScore);

        const distribution = stats.distribution ?? stats.scoreDistribution ?? [];
        const stepAverages = (stats.stepAvg ?? stats.stepAverages ?? []).map((s) => ({
            label: s.step ?? s.title ?? s.name ?? '—',
            value: val(s.avgScore, s.averageScore, s.avg_score),
        }));

        const questionDifficulty = (stats.questionDiff ?? stats.questionDifficulty ?? []).map((q) => ({
            label: q.question ?? q.title ?? '—',
            value: val(q.avgScore, q.averageScore, q.avg_score),
        }));

        const skillDifficulty = (stats.skillDiff ?? stats.skillDifficulty ?? []).map((s) => ({
            label: s.skill ?? s.title ?? s.name ?? '—',
            value: val(s.avgScore, s.averageScore, s.avg_score),
        }));

        return (
            <div>
                <Row className="g-3">
                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <SegmentedBar approved={approvalRate} rejected={rejectionRate} />
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md="3">
                        <Kpi title="Hire Rate" value={fmtPct(hireRate)} sub="Hires vs total applications" />
                    </Col>
                    <Col md="3">
                        <Kpi title="Avg Candidate Score" value={fmt1(avgCandidateScore)} sub="0–10" />
                    </Col>
                </Row>

                <Row className="g-3 mt-1">
                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <Histogram buckets={distribution} />
                            </CardBody>
                        </Card>
                    </Col>

                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>Avg Score per Step</div>
                                <ListGroup flush>
                                    {stepAverages.length === 0 && <ListGroupItem className="text-muted">—</ListGroupItem>}
                                    {stepAverages.map((s, i) => (
                                        <ListGroupItem key={`step-${i}`} className="d-flex align-items-center justify-content-between">
                                            <span>{s.label}</span>
                                            <strong>{fmt1(s.value)}</strong>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-3 mt-1">
                    <Col md="6">
                        <RankedList
                            title="Question Difficulty"
                            items={questionDifficulty}
                        />
                    </Col>
                    <Col md="6">
                        <RankedList
                            title="Skill Difficulty"
                            items={skillDifficulty}
                        />
                    </Col>
                </Row>
            </div>
        );
    }

    /* ---------- DEPARTMENT (ίδιο ύφος με segmented bar) ---------- */
    if (level === 'department') {
        const approvalRate = val(stats.approvalRate, stats.approval_rate);
        const rejectionRate = val(stats.rejectionRate, stats.rejection_rate);
        const avgCandPerJobAd = val(stats.avgCandidatesPerJobAd, stats.candidatesPerJobAd, stats.avg_cand_per_job);
        const distribution = stats.scoreDistribution ?? stats.distribution ?? [];

        const stepAverages = (stats.stepAverages ?? stats.stepAvg ?? stats.stepDifficulty ?? []).map((s) => ({
            label: s.step ?? s.title ?? s.name ?? '—',
            value: val(s.avgScore, s.averageScore, s.avg_score),
        }));

        const occupationDifficulty = (stats.occupationDifficulty ?? stats.occDifficulty ?? []).map((o) => ({
            label: o.occupation ?? o.title ?? o.name ?? '—',
            value: val(o.avgScore, o.averageScore, o.avg_score),
        }));

        const skillDifficulty = (stats.skillDifficulty ?? stats.skillDiff ?? []).map((s) => ({
            label: s.skill ?? s.title ?? s.name ?? '—',
            value: val(s.avgScore, s.averageScore, s.avg_score),
        }));

        return (
            <div>
                <Row className="g-3">
                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <SegmentedBar approved={approvalRate} rejected={rejectionRate} />
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md="6">
                        <Kpi title="Avg Candidates / Job Ad" value={fmt1(avgCandPerJobAd)} />
                    </Col>
                </Row>

                <Row className="g-3 mt-1">
                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <Histogram buckets={distribution} />
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>Step Averages</div>
                                <ListGroup flush>
                                    {stepAverages.length === 0 && <ListGroupItem className="text-muted">—</ListGroupItem>}
                                    {stepAverages.map((s, i) => (
                                        <ListGroupItem key={`dep-step-${i}`} className="d-flex align-items-center justify-content-between">
                                            <span>{s.label}</span>
                                            <strong>{fmt1(s.value)}</strong>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-3 mt-1">
                    <Col md="6">
                        <RankedList
                            title="Occupation Difficulty"
                            items={occupationDifficulty}
                        />
                    </Col>
                    <Col md="6">
                        <RankedList
                            title="Skill Difficulty"
                            items={skillDifficulty}
                        />
                    </Col>
                </Row>
            </div>
        );
    }

    /* ---------- OCCUPATION (ίδιο ύφος με segmented bar) ---------- */
    if (level === 'occupation') {
        const approvalRate = val(stats.approvalRate, stats.approval_rate);
        const rejectionRate = val(stats.rejectionRate, stats.rejection_rate);
        const avgCandPerJobAd = val(stats.candidatesPerJobAd, stats.avgCandidatesPerJobAd, stats.avg_cand_per_job);
        const distribution = stats.scoreDistribution ?? stats.distribution ?? [];

        const stepAverages = (stats.stepAverages ?? stats.stepAvg ?? stats.stepDifficulty ?? []).map((s) => ({
            label: s.step ?? s.title ?? s.name ?? '—',
            value: val(s.avgScore, s.averageScore, s.avg_score),
        }));

        const skillDifficulty = (stats.skillDifficulty ?? stats.skillDiff ?? []).map((s) => ({
            label: s.skill ?? s.title ?? s.name ?? '—',
            value: val(s.avgScore, s.averageScore, s.avg_score),
        }));

        return (
            <div>
                <Row className="g-3">
                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <SegmentedBar approved={approvalRate} rejected={rejectionRate} />
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md="6">
                        <Kpi title="Avg Candidates / Job Ad" value={fmt1(avgCandPerJobAd)} />
                    </Col>
                </Row>

                <Row className="g-3 mt-1">
                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <Histogram buckets={distribution} />
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>Step Averages</div>
                                <ListGroup flush>
                                    {stepAverages.length === 0 && <ListGroupItem className="text-muted">—</ListGroupItem>}
                                    {stepAverages.map((s, i) => (
                                        <ListGroupItem key={`occ-step-${i}`} className="d-flex align-items-center justify-content-between">
                                            <span>{s.label}</span>
                                            <strong>{fmt1(s.value)}</strong>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-3 mt-1">
                    <Col md="12">
                        <RankedList
                            title="Skill Difficulty"
                            items={skillDifficulty}
                        />
                    </Col>
                </Row>
            </div>
        );
    }

    /* ---------- ORGANIZATION (καθαρό layout) ---------- */
    return (
        <div>
            <Row className="g-3">
                <Col md="3"><Kpi title="Approval Rate" value={fmtPct(stats.approvalRate)} /></Col>
                <Col md="3"><Kpi title="Rejection Rate" value={fmtPct(stats.rejectionRate)} /></Col>
                <Col md="3"><Kpi title="Hire Rate" value={fmtPct(stats.hireRate)} /></Col>
                <Col md="3"><Kpi title="Hires" value={stats.hireCount ?? stats.hires ?? '—'} /></Col>
            </Row>

            <Row className="g-3 mt-1">
                <Col md="6">
                    <RankedList
                        title="Top Skills"
                        hintLowerHarder={false}
                        items={(stats.top5Skills ?? stats.topSkills ?? []).map((s) => ({
                            label: s.skill ?? s.title ?? s.name ?? '—',
                            value: val(s.avgScore, s.averageScore, s.avg_score),
                        }))}
                    />
                </Col>
                <Col md="6">
                    <RankedList
                        title="Weakest Skills"
                        hintLowerHarder={false}
                        items={(stats.weakest5Skills ?? stats.weak5Skills ?? []).map((s) => ({
                            label: s.skill ?? s.title ?? s.name ?? '—',
                            value: val(s.avgScore, s.averageScore, s.avg_score),
                        }))}
                    />
                </Col>
            </Row>
        </div>
    );
}
