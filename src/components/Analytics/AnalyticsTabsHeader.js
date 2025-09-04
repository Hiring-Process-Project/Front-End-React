import { Nav, NavItem, NavLink } from 'reactstrap';

export default function AnalyticsTabsHeader({ activeTab, setActiveTab }) {
    const baseStyle = {
        color: '#111',
        marginRight: 14,
        cursor: 'pointer',
        fontWeight: 400,
        userSelect: 'none',
    };

    const linkClass = (name) => (activeTab === name ? 'active' : '');

    return (
        <Nav tabs className="analytics-tabs mb-2">
            <NavItem>
                <NavLink
                    className={linkClass('overview')}
                    style={baseStyle}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={linkClass('candidates')}
                    style={baseStyle}
                    onClick={() => setActiveTab('candidates')}
                >
                    Candidates
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={linkClass('steps')}
                    style={baseStyle}
                    onClick={() => setActiveTab('steps')}
                >
                    Steps
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={linkClass('questions')}
                    style={baseStyle}
                    onClick={() => setActiveTab('questions')}
                >
                    Questions
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={linkClass('skills')}
                    style={baseStyle}
                    onClick={() => setActiveTab('skills')}
                >
                    Skills
                </NavLink>
            </NavItem>
        </Nav>
    );
}
