import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';

export default function StatisticsTabs({ activeTab, setActiveTab, canQuestions, canSkills }) {
    const tabClass = (enabled, name) =>
        'cursor-pointer ' + (!enabled ? 'text-muted disabled' : activeTab === name ? 'active' : '');

    return (
        <Nav tabs>
            <NavItem>
                <NavLink className={tabClass(true, 'overview')} onClick={() => setActiveTab('overview')}>
                    Overview
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink className={tabClass(true, 'candidates')} onClick={() => setActiveTab('candidates')}>
                    Candidates
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink className={tabClass(true, 'steps')} onClick={() => setActiveTab('steps')}>
                    Steps
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={tabClass(canQuestions, 'questions')}
                    onClick={() => canQuestions && setActiveTab('questions')}
                    title={!canQuestions ? 'Pick a step first' : ''}
                    style={{ pointerEvents: canQuestions ? 'auto' : 'none' }}
                >
                    Questions
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={tabClass(canSkills, 'skills')}
                    onClick={() => canSkills && setActiveTab('skills')}
                    title={!canSkills ? 'Pick a question first' : ''}
                    style={{ pointerEvents: canSkills ? 'auto' : 'none' }}
                >
                    Skills
                </NavLink>
            </NavItem>
        </Nav>
    );
}
