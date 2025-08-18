import React, { PureComponent } from 'react';
import { Button, Badge } from 'reactstrap';

export default class StepsTab extends PureComponent {
    render() {
        const { steps, selectedStepId, onSelectStep } = this.props;

        return (
            <>
                <div className="mb-2" style={{ fontWeight: 600 }}>Select a step:</div>
                <div className="d-flex flex-column" style={{ gap: 8 }}>
                    {(steps || []).map(s => (
                        <Button
                            key={s.id ?? s.name}
                            color={s.id === selectedStepId ? 'primary' : 'light'}
                            onClick={() => onSelectStep(s.id)}
                            className="d-flex justify-content-between align-items-center"
                        >
                            <span>{s.name}</span>
                            <Badge pill>{(s.questions?.length ?? 0)} questions</Badge>
                        </Button>
                    ))}
                </div>

                <div style={{ marginTop: 16, minHeight: 220 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Step statistics</div>
                    <div style={{ opacity: .7 }}>
                        {selectedStepId
                            ? 'Εδώ KPI για το step (avg, ranking questions, bottleneck …)'
                            : 'Pick a step to see its statistics.'}
                    </div>
                </div>
            </>
        );
    }
}
