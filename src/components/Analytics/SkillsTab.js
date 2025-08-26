// src/components/Analytics/SkillsTab.js
import React from 'react';
import { ListGroup, ListGroupItem } from 'reactstrap';

export default function SkillsTab({ question }) {
    if (!question) return <div className="text-muted">Pick a question to see its skills.</div>;
    const skills = Array.isArray(question.skills) ? question.skills : [];
    return (
        <ListGroup>
            {skills.map((s) => (
                <ListGroupItem key={s.id || s.skill || s.name}>
                    {s.name || s.skill || `Skill ${s.id}`}
                </ListGroupItem>
            ))}
            {skills.length === 0 && <ListGroupItem className="text-muted">No skills mapped.</ListGroupItem>}
        </ListGroup>
    );
}
