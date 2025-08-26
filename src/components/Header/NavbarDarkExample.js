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
        if (isDisabled(key)) { e?.preventDefault?.(); return; } // μπλοκ click στα κλειδωμένα
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
                <Nav.Link eventKey="description" title="Περιγραφή της αγγελίας">
                    Description
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link eventKey="interview" title="Στάδια συνέντευξης">
                    Interview
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link eventKey="questions" title="Ερωτήσεις αξιολόγησης">
                    Questions
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link
                    eventKey="candidates"
                    title={isDisabled('candidates') ? 'Διαθέσιμο μετά το Publish' : 'Υποψήφιοι για την αγγελία'}
                    className={isDisabled('candidates') ? 'tab-disabled' : ''}
                >
                    Candidates
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link
                    eventKey="analytics"
                    title={isDisabled('analytics') ? 'Διαθέσιμο μετά το Publish' : 'Στατιστικά και γραφήματα'}
                    className={isDisabled('analytics') ? 'tab-disabled' : ''}
                >
                    Analytics
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link
                    eventKey="hire"
                    title={isDisabled('hire') ? 'Διαθέσιμο μετά το Publish' : 'Διαδικασία πρόσληψης'}
                    className={isDisabled('hire') ? 'tab-disabled' : ''}
                >
                    Hire
                </Nav.Link>
            </Nav.Item>
        </Nav>
    );
}

export default NavbarDarkExample;
