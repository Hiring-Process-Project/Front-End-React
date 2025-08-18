import React, { PureComponent } from 'react';

export default class SkillsTab extends PureComponent {
    render() {
        const { question } = this.props;

        if (!question) return <div style={{ opacity: .7 }}>Pick a question first.</div>;

        return (
            <div style={{ marginTop: 0, minHeight: 220 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{question.question}</div>
                <div style={{ opacity: .7 }}>Εδώ στατιστικά για skills (avg per skill, % above target, heatmap…)</div>
            </div>
        );
    }
}
