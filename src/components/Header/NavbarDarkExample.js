// src/components/Header/NavbarDarkExample.js
import React from 'react';
import Nav from 'react-bootstrap/Nav';
import 'bootstrap/dist/css/bootstrap.min.css';
import './header.css';

function NavbarDarkExample({
    onSelect,
    selectedTab = 'description',
    disabledTabs = [],
}) {
    const isDisabled = (key) => disabledTabs.includes(key);

    const handleSelect = (key, e) => {
        if (!key) return;
        if (isDisabled(key)) { e?.preventDefault?.(); return; } // block click on locked tabs
        onSelect?.(key);
    };

    return (
        <Nav
            variant="pills"
            activeKey={selectedTab}          // controlled
            onSelect={handleSelect}
            className="custom-pills"
        >
            <Nav.Item>
                <Nav.Link eventKey="description" title="Job description">
                    Description
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link eventKey="interview" title="Interview steps">
                    Interview
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link eventKey="questions" title="Evaluation questions">
                    Questions
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link
                    eventKey="candidates"
                    title={isDisabled('candidates') ? 'Available after Publish' : 'Job candidates'}
                    className={isDisabled('candidates') ? 'tab-disabled' : ''}
                >
                    Candidates
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link
                    eventKey="analytics"
                    title={isDisabled('analytics') ? 'Available after Publish' : 'Statistics & charts'}
                    className={isDisabled('analytics') ? 'tab-disabled' : ''}
                >
                    Analytics
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link
                    eventKey="hire"
                    title={isDisabled('hire') ? 'Available after Publish' : 'Hiring process'}
                    className={isDisabled('hire') ? 'tab-disabled' : ''}
                >
                    Hire
                </Nav.Link>
            </Nav.Item>
        </Nav>
    );
}

export default NavbarDarkExample;
