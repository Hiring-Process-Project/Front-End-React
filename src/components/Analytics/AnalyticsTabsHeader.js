import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';

export default function AnalyticsTabsHeader({ activeTab, setActiveTab }) {
    const tabClass = (name) => ('cursor-pointer ' + (activeTab === name ? 'active' : ''));

    return (
        <Nav tabs>
            <NavItem>
                <NavLink className={tabClass('overview')} onClick={() => setActiveTab('overview')}>
                    Overview
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink className={tabClass('candidates')} onClick={() => setActiveTab('candidates')}>
                    Candidates
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink className={tabClass('steps')} onClick={() => setActiveTab('steps')}>
                    Steps
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink className={tabClass('questions')} onClick={() => setActiveTab('questions')}>
                    Questions
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink className={tabClass('skills')} onClick={() => setActiveTab('skills')}>
                    Skills
                </NavLink>
            </NavItem>
        </Nav>
    );
}
