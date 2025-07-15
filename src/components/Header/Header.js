import React from 'react';
import logo from '../../images/logo.png';
import NavbarDarkExample from './NavbarDarkExample';
import { Col, Row } from 'reactstrap';
import './header.css'

function Header({ setSelectedTab }) {
    return (
        <Row>
            <header className="custom-header">
                <Col md="4" style={{ paddingTop: '25px' }}>
                    <img src={logo} className="logo-img" alt="logo" />
                </Col>
                <Col md="8" style={{ marginLeft: '-150px', paddingTop: '60px' }}>
                    <NavbarDarkExample onSelect={setSelectedTab} />
                </Col>
            </header>
        </Row>
    );
}

export default Header;
