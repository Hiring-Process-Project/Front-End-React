import React, { PureComponent } from 'react';
import { Button, Badge } from 'reactstrap';

export default class QuestionsTab extends PureComponent {
    render() {
        const { step, selectedQuestionId, onSelectQuestion } = this.props;

        if (!step) return <div style={{ opacity: .7 }}>Pick a step first.</div>;

        return (
            <>
                <div className="mb-2" style={{ fontWeight: 600 }}>Step: {step.name}</div>
                <div className="d-flex flex-column" style={{ gap: 8 }}>
                    {(step.questions ?? []).map(q => (
                        <Button
                            key={q.id ?? q.question}
                            color={q.id === selectedQuestionId ? 'primary' : 'light'}
                            onClick={() => onSelectQuestion(q.id)}
                            className="d-flex justify-content-between align-items-center"
                        >
                            <span>{q.question}</span>
                            <Badge pill>{(q.skills?.length ?? 0)} skills</Badge>
                        </Button>
                    ))}
                </div>

                <div style={{ marginTop: 16, minHeight: 220 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Question statistics</div>
                    <div style={{ opacity: .7 }}>
                        {selectedQuestionId
                            ? 'Εδώ KPI για το question (avg, distribution, per-skill …)'
                            : 'Pick a question to see its statistics.'}
                    </div>
                </div>
            </>
        );
    }
}
