import React, { useState } from 'react';
import { Button, Badge, Collapse } from 'reactstrap';
import './Candidates.css';

export default function StepsDropDown({
    steps = [],              // Steps → Questions → Skills
    ratings = {},            // { "<Step>::<SkillName>": { value, comment } }
    onSelect,                // (step, question) => void
    showScore = true
}) {
    const [openIndex, setOpenIndex] = useState(null);

    const makeSkillKey = (stepName, skill) => {
        const sName = typeof skill === 'string' ? skill : (skill?.name || String(skill));
        return `${stepName}::${sName}`;
    };

    // ---- Question stats: μέσος όρος skills (partial-friendly) ----
    const computeQuestionStats = (question, step) => {
        const stepName = step?.name || 'step';
        const skills = Array.isArray(question?.skills) ? question.skills : [];
        const ids = skills.map(sk => makeSkillKey(stepName, sk));

        const total = ids.length;
        const vals = ids.map(id => ratings[id]?.value).filter(v => Number.isFinite(v));
        const ratedCount = vals.length;
        const complete = total > 0 && ratedCount === total;

        const avg = ratedCount > 0
            ? Math.round(vals.reduce((a, b) => a + b, 0) / ratedCount)
            : null;

        return { avg, ratedCount, total, complete };
    };

    // ---- Step stats: μέσος όρος των question averages (κάθε question ισότιμα) ----
    const computeStepStats = (step) => {
        const qs = Array.isArray(step?.questions) ? step.questions : [];
        const totalQ = qs.length;

        let counted = 0;    // πόσα questions έχουν τουλάχιστον 1 βαθμό
        let sumAvgs = 0;
        let completedQ = 0; // πόσα questions είναι πλήρως βαθμολογημένα

        for (const q of qs) {
            const { avg, ratedCount, total, complete } = computeQuestionStats(q, step);
            if (ratedCount > 0) { counted += 1; sumAvgs += avg; }
            if (complete) completedQ += 1;
        }

        const avg = counted > 0 ? Math.round(sumAvgs / counted) : null;

        return {
            avg,
            countedQuestions: counted,     // συμμετέχουν στον μέσο
            ratedQuestions: completedQ,    // πλήρως βαθμολογημένα
            totalQuestions: totalQ
        };
    };

    return (
        <div className="candidate-container">
            {steps.map((step, idx) => {
                const isOpen = openIndex === idx;
                const stepStats = computeStepStats(step);

                const totalQ = stepStats.totalQuestions ?? 0;
                const ratedQ = stepStats.ratedQuestions ?? 0;
                const pct = totalQ ? Math.round((ratedQ / totalQ) * 100) : 0;

                return (
                    <div key={step.name || idx} className="question-box">
                        <Button
                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                            className={`question-btn ${isOpen ? 'active' : ''}`}
                            block
                            style={{ textAlign: 'left' }}
                        >
                            <div className="question-header">
                                <span className="question-text">{step.name}</span>

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
                                        const qStats = showScore ? computeQuestionStats(q, step) : null;
                                        const skillsCount = q?.skills?.length ?? 0;

                                        return (
                                            <button
                                                key={q.id ?? `${step.name}::${i}`}
                                                type="button"
                                                className="step-btn"
                                                onClick={(e) => { e.stopPropagation(); onSelect?.(step, q); }}
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                            >
                                                <span style={{ paddingRight: 8 }}>{q.question}</span>

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
                                                            {qStats?.ratedCount ?? 0}/{qStats?.total ?? skillsCount} rated
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
