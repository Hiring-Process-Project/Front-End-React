import React, { useState, useEffect } from 'react';
import { Button, Badge, Collapse } from 'reactstrap';
import './Candidates.css';

const API_BASE =
    process.env.REACT_APP_API_BASE;

/* --------- helpers για το χρώμα & το μικρό “swatch” ---------- */
function scoreColor(value) {
    if (!Number.isFinite(value)) return '#6b7280'; // gray for N/A
    if (value < 25) return '#dc2626';              // red
    if (value < 50) return '#f97316';              // orange
    if (value < 75) return '#eab308';              // yellow
    return '#16a34a';                               // green
}

function ColorSwatch({ value, shape = 'vbar', size = 24, title }) {
    const v =
        value === '' || value === null || typeof value === 'undefined'
            ? NaN
            : Number(value);
    const bg = scoreColor(v);
    const base = { display: 'inline-block', background: bg };

    const style =
        shape === 'vbar'
            ? { ...base, width: 8, height: size, borderRadius: 4 }
            : shape === 'bar'
                ? { ...base, width: size, height: 8, borderRadius: 4 }
                : shape === 'square'
                    ? {
                        ...base,
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.08)',
                    }
                    : {
                        ...base,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        border: '1px solid rgba(0,0,0,0.08)',
                    };

    return <span aria-hidden title={title} style={style} />;
}

export default function StepsDropDown({
    steps = [],
    ratings = {},
    onSelect,
    showScore = true,
    interviewReportId,
    candidateId,
}) {
    const [openIndex, setOpenIndex] = useState(null);

    /** ---------- Backend metrics cache ---------- */
    const [metricsByQ, setMetricsByQ] = useState({});
    const allQids = (steps ?? [])
        .flatMap((s) => (s?.questions ?? []).map((q) => q?.id))
        .filter(Boolean);

    // fetch metrics είτε με interviewReportId είτε (fallback) με candidateId
    useEffect(() => {
        const hasIds = allQids.length > 0;
        const shouldFetch = showScore && hasIds && (interviewReportId || candidateId);
        if (!shouldFetch) {
            setMetricsByQ({});
            return;
        }

        const qs = allQids.join(',');
        const base = interviewReportId
            ? `${API_BASE}/api/v1/question-scores/metrics-by-report?interviewReportId=${encodeURIComponent(
                interviewReportId
            )}`
            : `${API_BASE}/api/v1/question-scores/metrics?candidateId=${encodeURIComponent(
                candidateId
            )}`;
        const url = `${base}&questionIds=${encodeURIComponent(qs)}`;

        let alive = true;
        (async () => {
            try {
                const r = await fetch(url);
                if (!r.ok) return;
                const data = await r.json(); // [{questionId,totalSkills,ratedSkills,averageScore}]
                if (!alive) return;
                const map = {};
                for (const m of data || []) {
                    if (m && m.questionId != null) map[m.questionId] = m;
                }
                setMetricsByQ(map);
            } catch {
                // ignore
            }
        })();

        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showScore, interviewReportId, candidateId, steps]);

    /* ---------- Helpers για Fallback υπολογισμών (όταν δεν έχουμε __metrics) ---------- */

    const makeSkillKey = (stepName, skill) => {
        const sName = typeof skill === 'string' ? skill : skill?.name || String(skill);
        return `${stepName}::${sName}`;
    };

    // Question stats από ratings (fallback)
    const computeQuestionStatsFallback = (question, step) => {
        const stepName = step?.name || 'step';
        const skills = Array.isArray(question?.skills) ? question.skills : [];
        const ids = skills.map((sk) => makeSkillKey(stepName, sk));

        const total = ids.length;
        const vals = ids
            .map((id) => ratings[id]?.value)
            .filter((v) => Number.isFinite(v));
        const ratedCount = vals.length;
        const complete = total > 0 && ratedCount === total;

        const avg =
            ratedCount > 0
                ? Math.round(vals.reduce((a, b) => a + b, 0) / ratedCount)
                : null;

        return { avg, ratedCount, total, complete };
    };

    // Step stats από τα question-stats (fallback)
    const computeStepStatsFallback = (step) => {
        const qs = Array.isArray(step?.questions) ? step.questions : [];
        const totalQ = qs.length;

        let counted = 0;
        let sumAvgs = 0;
        let fullyRatedQ = 0;

        for (const q of qs) {
            const { avg, ratedCount, total, complete } = computeQuestionStatsFallback(q, step);
            if (ratedCount > 0) {
                counted += 1;
                sumAvgs += avg ?? 0;
            }
            if (complete) fullyRatedQ += 1;
        }

        const avg = counted > 0 ? Math.round(sumAvgs / counted) : null;

        return {
            avg,
            ratedQuestions: fullyRatedQ,
            totalQuestions: totalQ,
        };
    };

    /* ---------- Επιλογή πηγής μετρικών (backend-first, με merge, αλλιώς fallback) ---------- */

    const getQuestionMetrics = (q, step) => {
        const remote = q?.id ? metricsByQ[q.id] : null; // από backend
        const local = q?.__metrics || {}; // από refreshMetrics

        // total: προτίμηση στο τοπικό αν είναι >0, αλλιώς backend, αλλιώς 0
        const total =
            Number.isFinite(local.totalSkills) && local.totalSkills > 0
                ? local.totalSkills
                : Number.isFinite(remote?.totalSkills)
                    ? remote.totalSkills
                    : 0;

        // rated: μέγιστο από local/remote
        const ratedCount = Math.max(
            Number.isFinite(local.ratedSkills) ? local.ratedSkills : 0,
            Number.isFinite(remote?.ratedSkills) ? remote.ratedSkills : 0
        );

        // avg: προτίμηση στο τοπικό αν υπάρχει, αλλιώς backend
        const avg = Number.isFinite(local.averageScore)
            ? local.averageScore
            : Number.isFinite(remote?.averageScore)
                ? remote.averageScore
                : null;

        return {
            total,
            ratedCount,
            avg,
            complete: total > 0 && ratedCount === total,
        };
    };

    const getStepMetrics = (step) => {
        if (step?.__metrics) {
            const {
                totalQuestions = 0,
                ratedQuestions = 0,
                averageScore = null,
            } = step.__metrics || {};
            return { totalQuestions, ratedQuestions, avg: averageScore };
        }
        // Αν έχουμε backend question metrics, συνθέτουμε step metrics από αυτά
        const qs = Array.isArray(step?.questions) ? step.questions : [];
        const totalQuestions = qs.length;
        if (totalQuestions > 0 && Object.keys(metricsByQ).length > 0) {
            let ratedQuestions = 0;
            let sum = 0,
                cnt = 0;

            for (const q of qs) {
                const m = q?.id ? metricsByQ[q.id] : null;
                if (!m) continue;

                // fallback: __metrics.totalSkills ή q.skills.length
                const totalSkillsForQ = Number.isFinite(m?.totalSkills)
                    ? m.totalSkills
                    : Number.isFinite(q?.__metrics?.totalSkills)
                        ? q.__metrics.totalSkills
                        : Array.isArray(q?.skills)
                            ? q.skills.length
                            : 0;

                if (
                    totalSkillsForQ > 0 &&
                    Number.isFinite(m.ratedSkills) &&
                    m.ratedSkills === totalSkillsForQ
                ) {
                    ratedQuestions += 1;
                }

                if (Number.isFinite(m.averageScore)) {
                    sum += m.averageScore;
                    cnt += 1;
                }
            }

            const avg = cnt ? Math.round(sum / cnt) : null;
            return { totalQuestions, ratedQuestions, avg };
        }
        // Fallback από ratings/skills
        return computeStepStatsFallback(step);
    };

    /* -------------------------------- UI -------------------------------- */

    return (
        <div className="candidate-container">
            {steps.map((step, idx) => {
                const isOpen = openIndex === idx;
                const stepStats = getStepMetrics(step);

                const totalQ = stepStats.totalQuestions ?? 0;
                const ratedQ = stepStats.ratedQuestions ?? 0;
                const pct = totalQ ? Math.round((ratedQ / totalQ) * 100) : 0;

                return (
                    <div key={step.id ?? step.name ?? idx} className="question-box">
                        <Button
                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                            className={`question-btn ${isOpen ? 'active' : ''}`}
                            block
                            style={{ textAlign: 'left' }}
                        >
                            <div className="question-header">
                                <span className="question-text">{step.name ?? step.title}</span>

                                {/* BADGES ΚΑΘΕΤΑ: #questions, rated/total, score% (+ swatch) */}
                                <div
                                    className="badge-group"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        gap: 4,
                                    }}
                                >
                                    <Badge pill className="steps-badge">
                                        {totalQ} questions
                                    </Badge>
                                    {showScore && (
                                        <>
                                            <Badge pill className="rated-badge">
                                                {ratedQ}/{totalQ} rated
                                            </Badge>

                                            {/* score badge + κάθετη μπάρα δίπλα */}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}
                                            >
                                                <Badge pill className="score-badge">
                                                    {stepStats.avg != null ? `${stepStats.avg}%` : '—%'}
                                                </Badge>
                                                <ColorSwatch
                                                    value={stepStats.avg}
                                                    shape="vbar"
                                                    size={24}
                                                    title="Step score color"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Collapse isOpen={isOpen}>

                                <div className="steps-wrapper">
                                    {(step.questions ?? []).map((q, i) => {
                                        const qStats = showScore ? getQuestionMetrics(q, step) : null;

                                        // προτεραιότητα στο backend για totalSkills, αλλιώς local __metrics
                                        const skillsCountFromMetrics =
                                            (q?.id && metricsByQ[q.id]?.totalSkills) ??
                                            q?.__metrics?.totalSkills;

                                        const skillsCount = Number.isFinite(skillsCountFromMetrics)
                                            ? skillsCountFromMetrics
                                            : q?.skills?.length ?? 0;

                                        // αν qStats.total = 0, χρησιμοποίησε skillsCount σαν παρονομαστή
                                        const denom =
                                            qStats?.total && qStats.total > 0
                                                ? qStats.total
                                                : skillsCount;

                                        return (
                                            <div
                                                key={q.id ?? `${step.name}::${i}`}
                                                className="step-btn"
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) => { e.stopPropagation(); onSelect?.(step, q); }}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(step, q); } }}
                                                title={q.question}
                                            >
                                                <span
                                                    style={{
                                                        paddingRight: 8,
                                                        minWidth: 0,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {q.question}
                                                </span>

                                                {/* BADGES ΚΑΘΕΤΑ: #skills, rated/total, score% (+ swatch) */}
                                                {showScore && (
                                                    <span
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'flex-end',
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <span className="badge steps-badge" style={{ margin: 0 }}>
                                                            {skillsCount} skills
                                                        </span>
                                                        <span className="badge rated-badge" style={{ margin: 0 }}>
                                                            {(qStats?.ratedCount ?? 0)}/{denom} rated
                                                        </span>

                                                        {/* score badge + κάθετη μπάρα δίπλα */}
                                                        <span
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                            }}
                                                        >
                                                            <span className="badge score-badge" style={{ margin: 0 }}>
                                                                {qStats?.avg != null ? `${qStats.avg}%` : '—%'}
                                                            </span>
                                                            <ColorSwatch
                                                                value={qStats?.avg}
                                                                shape="vbar"
                                                                size={24}
                                                                title="Question score color"
                                                            />
                                                        </span>
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Collapse>
                        </Button>
                    </div>
                );
            })}
        </div>
    );
}
