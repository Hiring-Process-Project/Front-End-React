import React from 'react';
import Nav from 'react-bootstrap/Nav';
import 'bootstrap/dist/css/bootstrap.min.css';
import './header.css'

function NavbarDarkExample({ onSelect }) {
    return (
        <Nav
            variant="pills"
            defaultActiveKey="description"
            onSelect={onSelect}
            className="custom-pills"
        >
            <Nav.Item>
                <Nav.Link eventKey="description">Description</Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="interview">Interview</Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="questions">Questions</Nav.Link>
            </Nav.Item>

            {/* Tabs με custom tooltips */}
            <Nav.Item>
                <Nav.Link
                    eventKey="candidates"
                    className="tooltip-tab"
                    data-tip="Αρχική αξιολόγηση υποψηφίων με βάση τα skills, τα questions και τα steps. Καταγράφονται σχόλια ανά skill."
                >
                    Candidates
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link
                    eventKey="result"
                    className="tooltip-tab"
                    data-tip="Συνολικές βαθμολογίες και σχόλια για τον υποψήφιο. Δυνατότητα έγκρισης ή απόρριψης."
                >
                    Result
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link
                    eventKey="statistics"
                    className="tooltip-tab"
                    data-tip="Στατιστικά στοιχεία για organization, department, occupation, job ad, candidate, step, question και skill."
                >
                    Statistics
                </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                <Nav.Link
                    eventKey="hire"
                    className="tooltip-tab"
                    data-tip="Τελικό στάδιο πρόσληψης, εμφανίζονται μόνο οι approved υποψήφιοι για το job ad."
                >
                    Hire
                </Nav.Link>
            </Nav.Item>
        </Nav>
    );
}

export default NavbarDarkExample;
