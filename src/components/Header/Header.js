import React from 'react';
import logo from '../../images/logo.png';
import NavbarDarkExample from './NavbarDarkExample';
import { Col, Row } from 'reactstrap';
import './header.css';

function Header({ selectedTab, setSelectedTab, disabledTabs = [], onSwitchPage }) {
    return (
        <Row>
            <header className="custom-header">

                {/* LEFT SIDE: Logo + Button */}
                <Col md="4" style={{ paddingTop: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src={logo} className="logo-img" alt="logo" />

                    {/* Το κουμπί που ζήτησες
                    <button
                        className="switch-btn"
                        onClick={onSwitchPage}
                        style={{
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            padding: "8px 14px",
                            borderRadius: "6px",
                            cursor: "pointer"
                        }}
                    >
                        Μετάβαση
                    </button> */}
                </Col>

                {/* RIGHT SIDE: Τα tabs */}
                <Col md="8" style={{ marginLeft: '-150px', paddingTop: '60px' }}>
                    <NavbarDarkExample
                        onSelect={setSelectedTab}
                        selectedTab={selectedTab}
                        disabledTabs={disabledTabs}
                    />
                </Col>

            </header>
        </Row>
    );
}

export default Header;
