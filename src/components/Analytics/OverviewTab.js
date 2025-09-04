import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner } from 'reactstrap';

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

const SEG_COLORS = {
    ap: '#3b82f6', // Approved
    rj: '#ef4444', // Rejected
    hr: '#16a34a', // Hired
    pd: '#6b7280', // Pending
};

/* Segmented bar: Approved / Rejected / Hired / Pending */
function SegmentedBar({ approved = 0, rejected = 0, hired = 0, showHired = true }) {
    let ap = Math.max(0, Math.min(100, +approved || 0));
    let rj = Math.max(0, Math.min(100, +rejected || 0));
    let hr = showHired ? Math.max(0, Math.min(100, +hired || 0)) : 0;

    const sum = ap + rj + (showHired ? hr : 0);
    if (sum > 100) {
        const f = 100 / sum;
        ap *= f; rj *= f; if (showHired) hr *= f;
    }
    const pending = Math.max(0, 100 - (ap + rj + (showHired ? hr : 0)));
    const fmtPct = (n) => `${n.toFixed(1)}%`;

    return (
        <div>

            <div
                className="d-flex"
                style={{ gap: 16, flexWrap: 'wrap', fontSize: 12, marginBottom: 6 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: SEG_COLORS.ap, display: 'inline-block' }} />
                    <span>Approved</span>
                    <strong style={{ color: SEG_COLORS.ap }}>{fmtPct(ap)}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: SEG_COLORS.rj, display: 'inline-block' }} />
                    <span>Rejected</span>
                    <strong style={{ color: SEG_COLORS.rj }}>{fmtPct(rj)}</strong>
                </div>

                {showHired && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: SEG_COLORS.hr, display: 'inline-block' }} />
                        <span>Hired</span>
                        <strong style={{ color: SEG_COLORS.hr }}>{fmtPct(hr)}</strong>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: SEG_COLORS.pd, display: 'inline-block' }} />
                    <span>Pending</span>
                    <strong style={{ color: SEG_COLORS.pd }}>{fmtPct(pending)}</strong>
                </div>
            </div>

            <div
                style={{
                    height: 18, background: '#e9ecef', borderRadius: 10, overflow: 'hidden',
                    marginTop: 6, whiteSpace: 'nowrap'
                }}
            >
                <div style={{ width: `${ap}%`, height: '100%', background: '#3b82f6', display: 'inline-block' }} />
                <div style={{ width: `${rj}%`, height: '100%', background: '#ef4444', display: 'inline-block' }} />
                {showHired && (
                    <div style={{ width: `${hr}%`, height: '100%', background: '#16a34a', display: 'inline-block' }} />
                )}
                <div style={{ width: `${pending}%`, height: '100%', background: '#6b7280', display: 'inline-block' }} />
            </div>
        </div>
    );
}

/* Vertical mini-histogram 0–100 */
function Histogram({ buckets }) {
    const mapped = (Array.isArray(buckets) ? buckets : []).map((b, i) => ({
        label: b.range ?? `${b.from ?? i * 10}–${b.to ?? (i === 9 ? 100 : (i + 1) * 10)}`,
        value: Number(b.count ?? b.cnt ?? b.value ?? 0),
    }));
    const max = Math.max(1, ...mapped.map((x) => x.value));

    return (
        <div>
            <div className="mb-2" style={{ fontWeight: 600 }}>Score Distribution (0–100)</div>
            {/* μικρή περιγραφή */}
            <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 6 }}>
                Each bar = candidates in that score range
            </div>
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

/* ---------- DATA FETCH ---------- */
const urlFor = (level, data, base) => {
    switch (level) {
        case 'jobAd': return `${base}/statistics/jobad/${data?.id ?? data?.jobAdId}`;
        case 'department': return `${base}/statistics/department/${data?.id ?? data?.departmentId}`;
        case 'occupation': return `${base}/statistics/occupation/${data?.departmentId}/${data?.id ?? data?.occupationId}`;
        case 'organization':
        default: return `${base}/statistics/organization/${data?.orgId ?? 3}`;
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

    if (loading) return <div className="d-flex align-items-center" style={{ gap: 8 }}><Spinner size="sm" /> Loading…</div>;
    if (err) return <div className="text-danger">Error: {err}</div>;
    if (!stats) return null;

    /* ---------- JOB AD ---------- */
    if (level === 'jobAd') {
        const approvalRate = stats.approvalRate ?? stats.approval_rate;
        const rejectionRate = stats.rejectionRate ?? stats.rejection_rate;
        const avgCandidateScore = stats.avgCandidateScore ?? stats.avg_score ?? stats.averageScore;

        const distribution = stats.scoreDistribution ?? stats.distribution ?? [];

        const stepAverages = (stats.stepAvg ?? stats.stepAverages ?? []).map((s) => ({
            label: s.step ?? s.title ?? s.name ?? '—',
            value: s.avgScore ?? s.averageScore ?? s.avg_score,
        }));

        const questionDifficulty = (stats.questionDiff ?? stats.questionDifficulty ?? []).map((q) => ({
            label: q.question ?? q.title ?? '—',
            value: q.avgScore ?? q.averageScore ?? q.avg_score,
        }));

        const skillDifficulty = (stats.skillDiff ?? stats.skillDifficulty ?? []).map((s) => ({
            label: s.skill ?? s.title ?? s.name ?? '—',
            value: s.avgScore ?? s.averageScore ?? s.avg_score,
        }));

        const totalCandidates = stats.totalCandidates ?? stats.total ?? 0;
        const complete = !!stats.complete; // <<< ΜΟΝΗ ΠΡΟΣΘΗΚΗ

        return (
            <div>
                {/* Row 1: Approved/Rejected + Completion + Avg Score + Candidates */}
                <Row className="g-3">
                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                {/* δεν δείχνουμε green hired bar εδώ */}
                                <SegmentedBar approved={approvalRate} rejected={rejectionRate} showHired={false} />
                            </CardBody>
                        </Card>
                    </Col>

                    {/* Completion badge INLINE */}
                    <Col md="2">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>Completion</div>
                                <div className="d-flex align-items-center" style={{ gap: 8, marginTop: 6 }}>
                                    <span
                                        className={`badge ${complete ? 'bg-success' : 'bg-secondary'} text-white`}
                                        style={{ fontSize: 12, padding: '6px 10px' }}
                                    >
                                        {complete ? 'Complete' : 'In progress'}
                                    </span>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col md="2">
                        <Kpi title="Candidates" value={totalCandidates} sub="Total for this Job Ad" />
                    </Col>

                    <Col md="2">
                        <Kpi title="Avg Candidate Score" value={fmt1(avgCandidateScore)} sub="0–10" />
                    </Col>

                </Row>

                {/* Histogram + Step Difficulty */}
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
                                {/* CHANGED TITLE ONLY */}
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                                    Step Difficulty <span style={{ fontSize: 12, opacity: .6 }}>(lower = harder)</span>
                                </div>
                                <ListGroup flush>
                                    {stepAverages.length === 0 && (
                                        <ListGroupItem className="text-muted">—</ListGroupItem>
                                    )}
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

                {/* Question & Skill Difficulty (όπως ήταν) */}
                <Row className="g-3 mt-1">
                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                                    Question Difficulty <span style={{ fontSize: 12, opacity: .6 }}>(lower = harder)</span>
                                </div>
                                <ListGroup flush>
                                    {questionDifficulty.length === 0 && <ListGroupItem className="text-muted">—</ListGroupItem>}
                                    {questionDifficulty.map((q, i) => (
                                        <ListGroupItem key={`q-${i}`} className="d-flex align-items-center justify-content-between">
                                            <span>{q.label}</span><strong>{fmt1(q.value)}</strong>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                                    Skill Difficulty <span style={{ fontSize: 12, opacity: .6 }}>(lower = harder)</span>
                                </div>
                                <ListGroup flush>
                                    {skillDifficulty.length === 0 && <ListGroupItem className="text-muted">—</ListGroupItem>}
                                    {skillDifficulty.map((s, i) => (
                                        <ListGroupItem key={`s-${i}`} className="d-flex align-items-center justify-content-between">
                                            <span>{s.label}</span><strong>{fmt1(s.value)}</strong>
                                        </ListGroupItem>
                                    ))}
                                </ListGroup>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    /* ---------- DEPARTMENT ---------- */
    if (level === 'department') {
        const approvalRate = stats.approvalRate ?? stats.approval_rate;
        const rejectionRate = stats.rejectionRate ?? stats.rejection_rate;
        const hireRate = stats.hireRate ?? stats.hire_rate;
        const hireCount = stats.hireCount ?? stats.hires;
        const totalCandidates = stats.totalCandidates ?? stats.total;
        const avgCandPerJobAd = stats.avgCandidatesPerJobAd ?? stats.candidatesPerJobAd ?? stats.avg_cand_per_job;
        const distribution = stats.scoreDistribution ?? stats.distribution ?? [];
        const occupationDifficulty = (stats.occupationDifficulty ?? stats.occDifficulty ?? []).map((o) => ({
            label: o.occupation ?? o.title ?? o.name ?? '—',
            value: o.avgScore ?? o.averageScore ?? o.avg_score,
        }));

        return (
            <div>
                <Row className="g-3">
                    <Col md="6">
                        <Card className="shadow-sm h-100"><CardBody>
                            <SegmentedBar approved={approvalRate} rejected={rejectionRate} hired={hireRate} />
                        </CardBody></Card>
                    </Col>
                    <Col md="2"><Kpi title="Hires" value={hireCount ?? '—'} /></Col>
                    <Col md="2"><Kpi title="Candidates" value={totalCandidates ?? '—'} /></Col> {/* NEW */}
                    <Col md="2"><Kpi title="Avg Candidates / Job Ad" value={fmt1(avgCandPerJobAd)} /></Col>
                </Row>

                <Row className="g-3 mt-1">
                    <Col md="6">
                        <Card className="shadow-sm h-100"><CardBody>
                            <Histogram buckets={distribution} />
                        </CardBody></Card>
                    </Col>
                    <Col md="6">
                        <Card className="shadow-sm h-100"><CardBody>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Occupation Difficulty <span style={{ fontSize: 12, opacity: .6 }}>(lower = harder)</span></div>
                            <ListGroup flush>
                                {occupationDifficulty.length === 0 && <ListGroupItem className="text-muted">—</ListGroupItem>}
                                {occupationDifficulty.map((o, i) => (
                                    <ListGroupItem key={`occ-${i}`} className="d-flex align-items-center justify-content-between">
                                        <span>{o.label}</span><strong>{fmt1(o.value)}</strong>
                                    </ListGroupItem>
                                ))}
                            </ListGroup>
                        </CardBody></Card>
                    </Col>
                </Row>
            </div>
        );
    }

    /* ---------- OCCUPATION ---------- */
    if (level === 'occupation') {
        const approvalRate = stats.approvalRate ?? stats.approval_rate;
        const rejectionRate = stats.rejectionRate ?? stats.rejection_rate;
        const hireRate = stats.hireRate ?? stats.hire_rate;
        const hiredCount = stats.hireCount ?? stats.hires ?? 0;

        const avgCandPerJobAd =
            stats.candidatesPerJobAd ?? stats.avgCandidatesPerJobAd ?? stats.avg_cand_per_job;

        // ΝΕΑ πεδία από το API
        const totalCandidates = stats.totalCandidates ?? stats.total ?? 0;
        const distribution = stats.scoreDistribution ?? stats.distribution ?? [];

        const jobAdDifficulty = (stats.jobAdDifficulty ?? []).map((it) => ({
            label: it.jobAd ?? it.title ?? it.name ?? '—',
            value: it.averageScore ?? it.avgScore ?? it.avg_score,
        }));

        const fmt1 = (n) => (Number.isFinite(+n) ? (+n).toFixed(1) : '—');

        return (
            <div>
                {/* 1η σειρά: bar + 2 KPIs */}
                <Row className="g-3">
                    <Col md="6">
                        <Card className="shadow-sm h-100">
                            <CardBody>
                                <SegmentedBar approved={approvalRate} rejected={rejectionRate} hired={hireRate} />
                            </CardBody>
                        </Card>
                    </Col>

                    {/* ΝΕΟ KPI: Hires */}
                    <Col md="2">
                        <Kpi title="Hires" value={hiredCount} />
                    </Col>

                    <Col md="2">
                        <Kpi title="Candidates" value={totalCandidates} sub="Total in this occupation" />
                    </Col>
                    <Col md="2">
                        <Kpi title="Avg Candidates / Job Ad" value={fmt1(avgCandPerJobAd)} />
                    </Col>
                </Row>

                {/* 2η σειρά: Histogram + Job Ad Difficulty */}
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
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                                    Job Ad Difficulty <span style={{ fontSize: 12, opacity: .6 }}>(lower = harder)</span>
                                </div>

                                {jobAdDifficulty.length > 0 ? (
                                    <ul className="list-unstyled mb-0">
                                        {jobAdDifficulty.map((j, i) => (
                                            <li
                                                key={i}
                                                className="d-flex align-items-center justify-content-between py-1"
                                                style={{ borderBottom: '1px solid #f1f3f5' }}
                                            >
                                                <span>{j.label}</span>
                                                <strong>{fmt1(j.value)}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-muted">—</div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    /* ---------- ORGANIZATION ---------- */
    return (
        <div>
            <Row className="g-3">
                <Col md="6">
                    <Card className="shadow-sm h-100"><CardBody>
                        <SegmentedBar approved={stats.approvalRate} rejected={stats.rejectionRate} hired={stats.hireRate} />
                    </CardBody></Card>
                </Col>

                <Col md="2">
                    <Kpi title="Hires" value={stats.hireCount ?? stats.hires ?? '—'} />
                </Col>
                <Col md="2">
                    <Kpi title="Candidates" value={stats.totalCandidates ?? stats.total ?? '—'} />
                </Col>
                {/* ΝΕΟ KPI */}
                <Col md="2">
                    <Kpi
                        title="Avg Candidates / Job Ad"
                        value={(Number.isFinite(+ (stats.avgCandidatesPerJobAd ?? stats.avg_cand_per_job ?? stats.candidatesPerJobAd))
                            ? (+ (stats.avgCandidatesPerJobAd ?? stats.avg_cand_per_job ?? stats.candidatesPerJobAd)).toFixed(1)
                            : '—')}
                    />
                </Col>
            </Row>


            {/* Top / Weakest skills όπως ήταν */}
            <Row className="g-3 mt-1">
                <Col md="6">
                    <Card className="shadow-sm h-100"><CardBody>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Top Skills</div>
                        <ListGroup flush>
                            {(stats.top5Skills ?? stats.topSkills ?? []).map((s, i) => (
                                <ListGroupItem key={`top-${i}`} className="d-flex align-items-center justify-content-between">
                                    <span>{s.skill ?? s.title ?? s.name ?? '—'}</span>
                                    <strong>{fmt1(s.avgScore ?? s.averageScore ?? s.avg_score)}</strong>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    </CardBody></Card>
                </Col>
                <Col md="6">
                    <Card className="shadow-sm h-100"><CardBody>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Weakest Skills</div>
                        <ListGroup flush>
                            {(stats.weakest5Skills ?? stats.weak5Skills ?? []).map((s, i) => (
                                <ListGroupItem key={`weak-${i}`} className="d-flex align-items-center justify-content-between">
                                    <span>{s.skill ?? s.title ?? s.name ?? '—'}</span>
                                    <strong>{fmt1(s.avgScore ?? s.averageScore ?? s.avg_score)}</strong>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    </CardBody></Card>
                </Col>
            </Row>

            {/* ΜΕΤΑΦΕΡΜΕΝΟ: Histogram ΚΑΤΩ από τα skills και σε μισό πλάτος */}
            <Row className="g-3 mt-1">
                <Col md="6">
                    <Card className="shadow-sm h-100">
                        <CardBody>
                            <Histogram buckets={stats.scoreDistribution ?? stats.distribution ?? []} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );

}
