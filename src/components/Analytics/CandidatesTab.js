import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, CardBody, ListGroup, ListGroupItem, Spinner, Progress, Button } from 'reactstrap';

const Kpi = ({ title, value, sub }) => (
    <Card className="shadow-sm h-100">
        <CardBody>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
            {sub && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{sub}</div>}
        </CardBody>
    </Card>
);

const fmt = (n, digits = 1) => (Number.isFinite(Number(n)) ? Number(n).toFixed(digits) : '—');
const fmtPercent = (n) => (Number.isFinite(Number(n)) ? `${Number(n).toFixed(1)}%` : '—');

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

export default function CandidatesTab({
    apiBase = 'http://localhost:8087/api',
    jobAd,
    jobAdId: jobAdIdProp,
    candidates: candidatesProp
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

    const [summary, setSummary] = useState(null);
    const [sumLoading, setSumLoading] = useState(false);
    const [sumErr, setSumErr] = useState('');

    const [selectedCandId, setSelectedCandId] = useState(null);
    const [candData, setCandData] = useState(null);
    const [candLoading, setCandLoading] = useState(false);
    const [candErr, setCandErr] = useState('');

    // Job-ad summary
    useEffect(() => {
        if (!jobAdId) { setSummary(null); return; }
        const ac = new AbortController();
        setSumLoading(true);
        setSumErr('');
        fetch(`${apiBase}/statistics/jobad/${jobAdId}/candidateSummary`, {
            headers: { Accept: 'application/json' },
            signal: ac.signal
        })
            .then(r => r.ok ? r.json()
                : r.text().then(t => Promise.reject(new Error(`HTTP ${r.status} ${r.statusText}: ${t}`))))
            .then(json => { setSummary(json); setSumLoading(false); })
            .catch(e => { if (e.name !== 'AbortError') { setSumErr(e.message || 'Failed'); setSumLoading(false); } });
        return () => ac.abort();
    }, [apiBase, jobAdId]);

    // Candidates list
    useEffect(() => {
        if (!jobAdId) { setFetchedCandidates([]); return; }
        if (providedCandidates && providedCandidates.length) { setFetchedCandidates([]); return; }

        const ac = new AbortController();
        setCandListLoading(true);
        setCandListErr('');

        fetch(`${apiBase}/statistics/jobad/${jobAdId}/candidates`, {
            headers: { Accept: 'application/json' },
            signal: ac.signal
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
                    Array.isArray(data) ? data :
                        Array.isArray(data?.candidates) ? data.candidates :
                            Array.isArray(data?.content) ? data.content :
                                Array.isArray(data?.items) ? data.items : [];

                const norm = arr.map(c => ({
                    id: c.id ?? c.candidateId ?? c.candId,
                    fullName: buildDisplayName(c),
                    status: c.status ?? c.applicationStatus ?? null,
                })).filter(x => x.id != null);

                setFetchedCandidates(norm);
                setCandListLoading(false);
            })
            .catch((e) => {
                if (e.name !== 'AbortError') { setCandListErr(e.message || 'Failed'); setCandListLoading(false); }
            });

        return () => ac.abort();
    }, [apiBase, jobAdId, providedCandidates]);

    // Per-candidate analytics
    useEffect(() => {
        if (!selectedCandId) { setCandData(null); setCandErr(''); return; }
        const ac = new AbortController();
        setCandLoading(true);
        setCandErr('');
        fetch(`${apiBase}/statistics/candidate/${selectedCandId}/stats`, {
            headers: { Accept: 'application/json' },
            signal: ac.signal
        })
            .then(r => r.ok ? r.json()
                : r.text().then(t => Promise.reject(new Error(`HTTP ${r.status} ${r.statusText}: ${t}`))))
            .then(json => { setCandData(json); setCandLoading(false); })
            .catch(e => { if (e.name !== 'AbortError') { setCandErr(e.message || 'Failed'); setCandLoading(false); } });
        return () => ac.abort();
    }, [apiBase, selectedCandId]);

    if (!jobAdId) {
        return <div className="text-muted">Pick a Job Ad to view candidates analytics.</div>;
    }

    return (
        <Row className="g-3">
            <Col lg="4">
                <Card className="shadow-sm h-100">
                    <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Candidates</div>

                        <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #e9ecef', borderRadius: 8, padding: 8 }}>
                            {candListLoading && (
                                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                    <Spinner size="sm" /> <span>Loading candidates…</span>
                                </div>
                            )}
                            {!candListLoading && candListErr && (
                                <div className="text-danger" style={{ fontSize: 12 }}>{candListErr}</div>
                            )}
                            {!candListLoading && !candListErr && candidateList?.length === 0 && (
                                <div className="text-muted" style={{ fontSize: 12 }}>No candidates for this job ad.</div>
                            )}
                            {candidateList?.map(c => {
                                const active = c.id === selectedCandId;
                                return (
                                    <Button
                                        key={c.id}
                                        onClick={() => setSelectedCandId(c.id)}
                                        className={`w-100 text-start ${active ? 'btn-secondary' : 'btn-light'}`}
                                        style={{ marginBottom: 6 }}
                                    >
                                        <div className="d-flex align-items-center justify-content-between">
                                            <span>{buildDisplayName(c)}</span>
                                            {c.status && <span className="badge bg-light text-dark">{c.status}</span>}
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>

                        <div style={{ fontWeight: 600, marginTop: 8 }}>Summary</div>
                        {sumLoading && (
                            <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                <Spinner size="sm" /> <span>Loading…</span>
                            </div>
                        )}
                        {sumErr && <div className="text-danger">Error: {sumErr}</div>}
                        {summary && (
                            <Row className="g-2">
                                <Col xs="6"><Kpi title="Approved" value={summary.approvedCount} /></Col>
                                <Col xs="6"><Kpi title="Pending" value={summary.pendingCount} /></Col>
                            </Row>
                        )}
                    </CardBody>
                </Card>
            </Col>

            <Col lg="8">
                {!selectedCandId && <div className="text-muted">Select a candidate to see detailed analytics.</div>}
                {selectedCandId && (
                    <Card className="shadow-sm">
                        <CardBody>
                            {candLoading && (
                                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                    <Spinner size="sm" /> <span>Loading candidate analytics…</span>
                                </div>
                            )}
                            {candErr && <div className="text-danger">Error: {candErr}</div>}

                            {candData && (
                                <>
                                    <Row className="g-3">
                                        <Col md="4">
                                            <Kpi title="Overall Score" value={fmt(candData.overallScore, 1)} sub="0–10" />
                                        </Col>
                                        <Col md="4">
                                            <Card className="shadow-sm h-100">
                                                <CardBody>
                                                    <div style={{ fontSize: 12, opacity: 0.7 }}>Required Skill Coverage</div>
                                                    <div className="d-flex align-items-center" style={{ gap: 8, marginTop: 6 }}>
                                                        <div style={{ flex: 1 }}><Progress value={candData.requiredSkillCoverage} /></div>
                                                        <strong style={{ width: 56, textAlign: 'right' }}>{fmtPercent(candData.requiredSkillCoverage)}</strong>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="4">
                                            <Card className="shadow-sm h-100">
                                                <CardBody>
                                                    <div style={{ fontSize: 12, opacity: 0.7 }}>Question Coverage</div>
                                                    <div className="d-flex align-items-center" style={{ gap: 8, marginTop: 6 }}>
                                                        <div style={{ flex: 1 }}><Progress value={candData.questionCoverage} /></div>
                                                        <strong style={{ width: 56, textAlign: 'right' }}>{fmtPercent(candData.questionCoverage)}</strong>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row className="g-3 mt-1">
                                        <Col md="6">
                                            <Card className="shadow-sm h-100">
                                                <CardBody>
                                                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Score per Step</div>
                                                    <ListGroup flush>
                                                        {(!candData.stepScores || !candData.stepScores.length) && <ListGroupItem className="text-muted">—</ListGroupItem>}
                                                        {candData.stepScores?.map(s => (
                                                            <ListGroupItem key={s.step} className="d-flex align-items-center justify-content-between">
                                                                <span>{s.step}</span>
                                                                <strong>{fmt(s.averageScore, 1)}</strong>
                                                            </ListGroupItem>
                                                        ))}
                                                    </ListGroup>
                                                </CardBody>
                                            </Card>
                                        </Col>

                                        <Col md="6">
                                            <Card className="shadow-sm h-100">
                                                <CardBody>
                                                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Score per Skill</div>
                                                    <ListGroup flush>
                                                        {(!candData.skillScores || !candData.skillScores.length) && <ListGroupItem className="text-muted">—</ListGroupItem>}
                                                        {candData.skillScores?.map(s => (
                                                            <ListGroupItem key={s.skill} className="d-flex align-items-center justify-content-between">
                                                                <span>{s.skill}</span>
                                                                <strong>{fmt(s.avgScore ?? s.averageScore, 1)}</strong>
                                                            </ListGroupItem>
                                                        ))}
                                                    </ListGroup>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row className="g-3 mt-1">
                                        <Col md="6">
                                            <Card className="shadow-sm h-100">
                                                <CardBody>
                                                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Score per Question</div>
                                                    <ListGroup flush>
                                                        {(!candData.questionScores || !candData.questionScores.length) && <ListGroupItem className="text-muted">—</ListGroupItem>}
                                                        {candData.questionScores?.map(q => (
                                                            <ListGroupItem key={q.question} className="d-flex align-items-center justify-content-between">
                                                                <span>{q.question}</span>
                                                                <strong>{fmt(q.score, 1)}</strong>
                                                            </ListGroupItem>
                                                        ))}
                                                    </ListGroup>
                                                </CardBody>
                                            </Card>
                                        </Col>

                                        <Col md="6">
                                            <Row className="g-3">
                                                <Col xs="12">
                                                    <Card className="shadow-sm h-100">
                                                        <CardBody>
                                                            <div style={{ fontWeight: 600, marginBottom: 8 }}>Strengths (Top 3)</div>
                                                            <ListGroup flush>
                                                                {(!candData.strengthProfile || !candData.strengthProfile.length) && <ListGroupItem className="text-muted">—</ListGroupItem>}
                                                                {candData.strengthProfile?.map(s => (
                                                                    <ListGroupItem key={s.skill} className="d-flex align-items-center justify-content-between">
                                                                        <span>{s.skill}</span>
                                                                        <strong>{fmt(s.avgScore ?? s.averageScore, 1)}</strong>
                                                                    </ListGroupItem>
                                                                ))}
                                                            </ListGroup>
                                                        </CardBody>
                                                    </Card>
                                                </Col>

                                                <Col xs="12">
                                                    <Card className="shadow-sm h-100">
                                                        <CardBody>
                                                            <div style={{ fontWeight: 600, marginBottom: 8 }}>Weaknesses (Bottom 3)</div>
                                                            <ListGroup flush>
                                                                {(!candData.weaknessProfile || !candData.weaknessProfile.length) && <ListGroupItem className="text-muted">—</ListGroupItem>}
                                                                {candData.weaknessProfile?.map(s => (
                                                                    <ListGroupItem key={s.skill} className="d-flex align-items-center justify-content-between">
                                                                        <span>{s.skill}</span>
                                                                        <strong>{fmt(s.avgScore ?? s.averageScore, 1)}</strong>
                                                                    </ListGroupItem>
                                                                ))}
                                                            </ListGroup>
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                            </Row>
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
