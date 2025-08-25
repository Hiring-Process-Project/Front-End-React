import React, { useState } from 'react';
import { Button, Badge, Collapse } from 'reactstrap';
import './Candidates.css';

/**
 * Props:
 *  - steps: [
 *      {
 *        id, name,
 *        // OPTIONAL: μετρικές από backend για το step
 *        __metrics?: {
 *          totalQuestions: number,
 *          ratedQuestions: number,      // ερωτήσεις με ΟΛΑ τα skills βαθμολογημένα
 *          averageScore: number | null  // 0..100
 *        },
 *        questions: [
 *          {
 *            id, question,
 *            skills?: [{ id, name }],   // προαιρετικά (για fallback υπολογισμών)
 *            // OPTIONAL: μετρικές από backend για την ερώτηση
 *            __metrics?: {
 *              totalSkills: number,
 *              ratedSkills: number,     // πόσα skills έχουν score
 *              averageScore: number | null
 *            }
 *          }
 *        ]
 *      }
 *    ]
 *
 *  - ratings (optional): { "<StepName>::<SkillName>": { value, comment } }
 *    Χρησιμοποιείται μόνο όταν ΔΕΝ υπάρχουν μετρικές από backend.
 *
 *  - onSelect(step, question)
 *  - showScore (default: true)
 */
export default function StepsDropDown({
    steps = [],
    ratings = {},
    onSelect,
    showScore = true,
}) {
    const [openIndex, setOpenIndex] = useState(null);

    /* ---------- Helpers για Fallback υπολογισμών (όταν δεν έχουμε __metrics) ---------- */

    const makeSkillKey = (stepName, skill) => {
        const sName = typeof skill === 'string' ? skill : (skill?.name || String(skill));
        return `${stepName}::${sName}`;
    };

    // Question stats από ratings (fallback)
    const computeQuestionStatsFallback = (question, step) => {
        const stepName = step?.name || 'step';
        const skills = Array.isArray(question?.skills) ? question.skills : [];
        const ids = skills.map(sk => makeSkillKey(stepName, sk));

        const total = ids.length;
        const vals = ids.map(id => ratings[id]?.value).filter(v => Number.isFinite(v));
        const ratedCount = vals.length;
        // Για να θεωρηθεί "rated" η ερώτηση, πρέπει να έχουν βαθμολογηθεί ΟΛΑ τα skills
        const complete = total > 0 && ratedCount === total;

        const avg = ratedCount > 0
            ? Math.round(vals.reduce((a, b) => a + b, 0) / ratedCount)
            : null;

        return { avg, ratedCount, total, complete };
    };

    // Step stats από τα question-stats (fallback)
    const computeStepStatsFallback = (step) => {
        const qs = Array.isArray(step?.questions) ? step.questions : [];
        const totalQ = qs.length;

        let counted = 0;     // πόσα questions έχουν avg (>= 1 skill rated)
        let sumAvgs = 0;
        let fullyRatedQ = 0; // πόσα questions έχουν ΟΛΑ τα skills rated

        for (const q of qs) {
            const { avg, ratedCount, total, complete } = computeQuestionStatsFallback(q, step);
            if (ratedCount > 0) { counted += 1; sumAvgs += (avg ?? 0); }
            if (complete) fullyRatedQ += 1;
        }

        const avg = counted > 0 ? Math.round(sumAvgs / counted) : null;

        return {
            avg,                          // μέσος όρος από όσες έχουν τουλ. 1 βαθμό
            ratedQuestions: fullyRatedQ,  // πλήρως βαθμολογημένες
            totalQuestions: totalQ
        };
    };

    /* ---------- Επιλογή πηγής μετρικών (backend-first, αλλιώς fallback) ---------- */

    const getQuestionMetrics = (q, step) => {
        if (q?.__metrics) {
            const { totalSkills = 0, ratedSkills = 0, averageScore = null } = q.__metrics || {};
            return { total: totalSkills, ratedCount: ratedSkills, avg: averageScore, complete: totalSkills > 0 && ratedSkills === totalSkills };
        }
        // fallback
        return computeQuestionStatsFallback(q, step);
    };

    const getStepMetrics = (step) => {
        if (step?.__metrics) {
            const { totalQuestions = 0, ratedQuestions = 0, averageScore = null } = step.__metrics || {};
            return { totalQuestions, ratedQuestions, avg: averageScore };
        }
        // fallback
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

                                {/* BADGES ΚΑΘΕΤΑ: #questions, rated/total, score% */}
                                <div
                                    className="badge-group"
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}
                                >
                                    <Badge pill className="steps-badge">
                                        {totalQ} questions
                                    </Badge>
                                    {showScore && (
                                        <>
                                            <Badge pill className="rated-badge">
                                                {ratedQ}/{totalQ} rated
                                            </Badge>
                                            <Badge pill className="score-badge">
                                                {stepStats.avg != null ? `${stepStats.avg}%` : '—%'}
                                            </Badge>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Collapse isOpen={isOpen}>
                                {showScore && totalQ > 0 && ratedQ < totalQ && (
                                    <div className="tiny-progress">
                                        <div className="tiny-progress__bar" style={{ width: `${pct}%` }} />
                                    </div>
                                )}

                                <div className="steps-wrapper">
                                    {(step.questions ?? []).map((q, i) => {
                                        const qStats = showScore ? getQuestionMetrics(q, step) : null;

                                        // Προτεραιότητα στα backend metrics για counts.
                                        const skillsCountFromMetrics = q?.__metrics?.totalSkills;
                                        const skillsCount =
                                            Number.isFinite(skillsCountFromMetrics)
                                                ? skillsCountFromMetrics
                                                : (q?.skills?.length ?? 0);

                                        return (
                                            <button
                                                key={q.id ?? `${step.name}::${i}`}
                                                type="button"
                                                className="step-btn"
                                                onClick={(e) => { e.stopPropagation(); onSelect?.(step, q); }}
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                title={q.question}
                                            >
                                                <span style={{ paddingRight: 8, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {q.question}
                                                </span>

                                                {/* BADGES ΚΑΘΕΤΑ: #skills, rated/total, score% */}
                                                {showScore && (
                                                    <span
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'flex-end',
                                                            gap: 4
                                                        }}
                                                    >
                                                        <span className="badge steps-badge" style={{ margin: 0 }}>
                                                            {skillsCount} skills
                                                        </span>
                                                        <span className="badge rated-badge" style={{ margin: 0 }}>
                                                            {(qStats?.ratedCount ?? 0)}/{(qStats?.total ?? skillsCount)} rated
                                                        </span>
                                                        <span className="badge score-badge" style={{ margin: 0 }}>
                                                            {qStats?.avg != null ? `${qStats.avg}%` : '—%'}
                                                        </span>
                                                    </span>
                                                )}
                                            </button>
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
