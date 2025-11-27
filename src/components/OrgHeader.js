import React from "react";
import { Col, Row } from 'reactstrap';
import "./Header/header.css"; // χρησιμοποιεί το ίδιο CSS του ήδη υπάρχοντος Header
import logo from '../images/logo.png';

export default function OrgHeader() {
    return (
        <Row>
            <header className="custom-header">
                <Col md="4" style={{ paddingTop: '25px' }}>
                    <img src={logo} className="logo-img" alt="logo" />
                </Col>
            </header>
        </Row>
    );
}
