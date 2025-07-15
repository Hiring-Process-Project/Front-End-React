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
                <Nav.Link eventKey="candidates">Candidates</Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="assessment">Assessment</Nav.Link>
            </Nav.Item>
        </Nav>
    );
}

export default NavbarDarkExample;
