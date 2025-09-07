import { Nav, NavItem, NavLink } from 'reactstrap';
import './Analytics.css';

export default function AnalyticsTabsHeader({ activeTab, setActiveTab }) {
    const linkClass = (name) => (activeTab === name ? 'active' : '');

    return (
        <Nav tabs className="analytics-tabs mb-2">
            <NavItem>
                <NavLink
                    className={`analytics-tablink ${linkClass('overview')}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={`analytics-tablink ${linkClass('candidates')}`}
                    onClick={() => setActiveTab('candidates')}
                >
                    Candidates
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={`analytics-tablink ${linkClass('steps')}`}
                    onClick={() => setActiveTab('steps')}
                >
                    Steps
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={`analytics-tablink ${linkClass('questions')}`}
                    onClick={() => setActiveTab('questions')}
                >
                    Questions
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={`analytics-tablink ${linkClass('skills')}`}
                    onClick={() => setActiveTab('skills')}
                >
                    Skills
                </NavLink>
            </NavItem>
        </Nav>
    );
}
