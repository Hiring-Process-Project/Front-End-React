import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner, Button } from 'reactstrap';
import './Analytics.css';

const Kpi = ({ title, value, sub }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div className="kpi-title">{title}</div>
            <div className="kpi-value">{value}</div>
            {sub && <div className="kpi-sub">{sub}</div>}
        </CardBody>
    </Card>
);

const fmt = (n, digits = 1) => {
    if (n === null || n === undefined || n === '' || Number.isNaN(Number(n))) return '—';
    return Number(n).toFixed(digits);
};

function buildDisplayName(c) {
    let name = c?.fullName ?? c?.name ?? null;
    if (!name) {
        const fn = String(c?.firstName ?? '').trim();
        const ln = String(c?.lastName ?? '').trim();
        const combined = [fn, ln].filter(Boolean).join(' ').trim();
        name = combined || null;
    }
    if (!name) {
        const id = c?.id ?? c?.candidateId ?? c?.candId ?? '';
        name = `Candidate ${id}`;
    }
    return name;
}

/* Μικρή κάρτα-λίστα για Strengths / Weaknesses */
const MiniList = ({ title, items = [] }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div className="section-title">{title}</div>
            <ListGroup flush>
                {(!items || items.length === 0) && (
                    <ListGroupItem className="text-muted">—</ListGroupItem>
                )}
                {items?.slice(0, 3).map((s) => (
                    <ListGroupItem
                        key={s.skill}
                        className="d-flex align-items-center justify-content-between"
                    >
                        <span>{s.skill}</span>
                        <strong>{fmt(s.avgScore ?? s.averageScore, 1)}</strong>
                    </ListGroupItem>
                ))}
            </ListGroup>
        </CardBody>
    </Card>
);

export default function CandidatesTab({
    apiBase = 'http://localhost:8087/api',
    jobAd,
    jobAdId: jobAdIdProp,
    candidates: candidatesProp,
}) {
    const jobAdId = useMemo(
        () => jobAdIdProp ?? jobAd?.id ?? jobAd?.jobAdId ?? null,
        [jobAdIdProp, jobAd]
    );
    const providedCandidates = useMemo(
        () => candidatesProp ?? jobAd?.candidates ?? [],
        [candidatesProp, jobAd]
    );

    const [fetchedCandidates, setFetchedCandidates] = useState([]);
    const [candListLoading, setCandListLoading] = useState(false);
    const [candListErr, setCandListErr] = useState('');

    const candidateList = providedCandidates?.length ? providedCandidates : fetchedCandidates;

    const [selectedCandId, setSelectedCandId] = useState(null);
    const [candData, setCandData] = useState(null);
    const [candLoading, setCandLoading] = useState(false);
    const [candErr, setCandErr] = useState('');

    // κρατάμε βαθμολογίες που έρχονται από το detail για να τις δείχνουμε στη λίστα
    const [scoresById, setScoresById] = useState({});

    // dropdown για "Score per: ..."
    const [scoreView, setScoreView] = useState('step'); // 'step' | 'question' | 'skill'

    const scoreItems = useMemo(() => {
        if (!candData) return [];
        if (scoreView === 'step') {
            return (candData.stepScores ?? []).map((s) => ({ label: s.step, value: s.averageScore }));
        }
        if (scoreView === 'question') {
            return (candData.questionScores ?? []).map((q) => ({ label: q.question, value: q.score }));
        }
        return (candData.skillScores ?? []).map((s) => ({ label: s.skill, value: s.avgScore ?? s.averageScore }));
    }, [candData, scoreView]);

    // Candidates list
    useEffect(() => {
        if (!jobAdId) {
            setFetchedCandidates([]);
            return;
        }
        if (providedCandidates && providedCandidates.length) {
            setFetchedCandidates([]);
            return;
        }

        const ac = new AbortController();
        setCandListLoading(true);
        setCandListErr('');

        fetch(`${apiBase}/statistics/jobad/${jobAdId}/candidates`, {
            headers: { Accept: 'application/json' },
            signal: ac.signal,
        })
            .then(async (r) => {
                if (!r.ok) {
                    const t = await r.text().catch(() => '');
                    throw new Error(`HTTP ${r.status} ${r.statusText}: ${t}`);
                }
                return r.json();
            })
            .then((data) => {
                const arr =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data?.candidates)
                            ? data.candidates
                            : Array.isArray(data?.content)
                                ? data.content
                                : Array.isArray(data?.items)
                                    ? data.items
                                    : [];

                const norm = arr
                    .map((c) => ({
                        id: c.id ?? c.candidateId ?? c.candId,
                        fullName: buildDisplayName(c),
                        status: c.status ?? c.applicationStatus ?? null,
                        score: c.overallScore ?? c.score ?? c.totalScore ?? c.avgScore, // αν υπάρχει από το API
                    }))
                    .filter((x) => x.id != null);

                setFetchedCandidates(norm);
                setCandListLoading(false);
            })
            .catch((e) => {
                if (e.name !== 'AbortError') {
                    setCandListErr(e.message || 'Failed');
                    setCandListLoading(false);
                }
            });

        return () => ac.abort();
    }, [apiBase, jobAdId, providedCandidates]);

    // NEW: Prefetch overall scores for all candidates so εμφανίζονται από την αρχή
    useEffect(() => {
        if (!candidateList || candidateList.length === 0) return;

        const missing = candidateList
            .filter(c => !Number.isFinite(Number(c.score)) && !Number.isFinite(Number(scoresById[c.id])))
            .map(c => c.id);

        if (missing.length === 0) return;

        let ignore = false;
        (async () => {
            const pairs = await Promise.all(
                missing.map(async (id) => {
                    try {
                        const r = await fetch(`${apiBase}/statistics/candidate/${id}/stats`, {
                            headers: { Accept: 'application/json' },
                        });
                        if (!r.ok) throw new Error('HTTP');
                        const j = await r.json();
                        const s = Number(j?.overallScore);
                        return Number.isFinite(s) ? [id, s] : null;
                    } catch {
                        return null;
                    }
                })
            );
            if (ignore) return;
            const map = {};
            pairs.forEach(p => { if (p) map[p[0]] = p[1]; });
            if (Object.keys(map).length) setScoresById(prev => ({ ...prev, ...map }));
        })();

        return () => { ignore = true; };
    }, [apiBase, candidateList, scoresById]);

    // Per-candidate analytics
    useEffect(() => {
        if (!selectedCandId) {
            setCandData(null);
            setCandErr('');
            return;
        }
        const ac = new AbortController();
        setCandLoading(true);
        setCandErr('');
        fetch(`${apiBase}/statistics/candidate/${selectedCandId}/stats`, {
            headers: { Accept: 'application/json' },
            signal: ac.signal,
        })
            .then((r) =>
                r.ok
                    ? r.json()
                    : r
                        .text()
                        .then((t) => Promise.reject(new Error(`HTTP ${r.status} ${r.statusText}: ${t}`)))
            )
            .then((json) => {
                setCandData(json);
                if (Number.isFinite(Number(json?.overallScore))) {
                    setScoresById((m) => ({ ...m, [selectedCandId]: Number(json.overallScore) }));
                }
                setCandLoading(false);
            })
            .catch((e) => {
                if (e.name !== 'AbortError') {
                    setCandErr(e.message || 'Failed');
                    setCandLoading(false);
                }
            });
        return () => ac.abort();
    }, [apiBase, selectedCandId]);

    if (!jobAdId) {
        return <div className="text-muted">Pick a Job Ad to view candidates analytics.</div>;
    }

    return (
        <Row className="g-3">
            {/* Αριστερά: μόνο λίστα υποψηφίων */}
            <Col lg="4">
                <Card className="shadow-sm h-100">
                    <CardBody className="ct-card-body">
                        <div className="fw-600 mb-1">Candidates</div>

                        <div className="cand-list">
                            {candListLoading && (
                                <div className="d-flex align-items-center gap-8">
                                    <Spinner size="sm" /> <span>Loading candidates…</span>
                                </div>
                            )}
                            {!candListLoading && candListErr && (
                                <div className="text-danger fs-12">
                                    {candListErr}
                                </div>
                            )}
                            {!candListLoading && !candListErr && candidateList?.length === 0 && (
                                <div className="text-muted fs-12">
                                    No candidates for this job ad.
                                </div>
                            )}
                            {candidateList?.map((c) => {
                                const active = c.id === selectedCandId;
                                const scoreVal = Number.isFinite(Number(c.score))
                                    ? Number(c.score)
                                    : (Number.isFinite(Number(scoresById[c.id])) ? Number(scoresById[c.id]) : undefined);

                                return (
                                    <Button
                                        key={c.id}
                                        onClick={() => setSelectedCandId(c.id)}
                                        className={`w-100 text-start ${active ? 'btn-secondary' : 'btn-light'} mb-6`}
                                    >
                                        <div className="d-flex align-items-center justify-content-between">
                                            <span>{buildDisplayName(c)}</span>
                                            <div className="d-flex align-items-center" style={{ gap: 6 }}>
                                                <span className="badge bg-dark-subtle text-dark">{fmt(scoreVal, 1)}</span>
                                                {c.status && <span className="badge bg-light text-dark">{c.status}</span>}
                                            </div>
                                        </div>
                                    </Button>
                                );
                            })}

                        </div>
                    </CardBody>
                </Card>
            </Col>

            {/* Δεξιά: Στατιστικά */}
            <Col lg="8">
                {!selectedCandId && (
                    <div className="text-muted">Select a candidate to see detailed analytics.</div>
                )}
                {selectedCandId && (
                    <Card className="shadow-sm">
                        <CardBody>
                            {candLoading && (
                                <div className="d-flex align-items-center gap-8">
                                    <Spinner size="sm" /> <span>Loading candidate analytics…</span>
                                </div>
                            )}
                            {candErr && <div className="text-danger">Error: {candErr}</div>}

                            {candData && (
                                <>
                                    {/* Row 1: Strengths & Weaknesses δίπλα-δίπλα */}
                                    <Row className="g-3">
                                        <Col md="6">
                                            <MiniList title="Strengths (Top 3 Skills)" items={candData.strengthProfile} />
                                        </Col>
                                        <Col md="6">
                                            <MiniList title="Weaknesses (Bottom 3 Skills)" items={candData.weaknessProfile} />
                                        </Col>
                                    </Row>

                                    {/* Row 2: Ενιαίο dropdown "Score per:" */}
                                    <Row className="g-3 mt-1">
                                        <Col md="12">
                                            <Card className="shadow-sm h-100">
                                                <CardBody>
                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                        <div className="section-title mb-0">Score per:</div>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            style={{ width: 180 }}
                                                            value={scoreView}
                                                            onChange={(e) => setScoreView(e.target.value)}
                                                        >
                                                            <option value="step">Step</option>
                                                            <option value="question">Question</option>
                                                            <option value="skill">Skill</option>
                                                        </select>
                                                    </div>

                                                    <ListGroup flush>
                                                        {scoreItems.length === 0 && (
                                                            <ListGroupItem className="text-muted">—</ListGroupItem>
                                                        )}
                                                        {scoreItems.map((it) => (
                                                            <ListGroupItem
                                                                key={it.label}
                                                                className="d-flex align-items-center justify-content-between"
                                                            >
                                                                <span>{it.label}</span>
                                                                <strong>{fmt(it.value, 1)}</strong>
                                                            </ListGroupItem>
                                                        ))}
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
