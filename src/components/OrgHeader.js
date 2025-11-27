import React from "react";
import { Col, Row } from 'reactstrap';
import "./Header/header.css";
import logo from '../images/logo.png';

export default function OrgHeader({ onSwitchPage }) {
    return (
        <Row>
            <header
                className="custom-header"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between", // logo left, button right
                    width: "100%",
                    padding: "20px"
                }}
            >
                {/* LOGO */}
                <Col md="4" style={{ paddingTop: '10px' }}>
                    <img src={logo} className="logo-img" alt="logo" />
                </Col>

                {/* BUTTON */}
                <button
                    onClick={onSwitchPage}
                    style={{
                        padding: "10px 16px",
                        fontSize: "15px",
                        cursor: "pointer",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        background: "#fff"
                    }}
                >
                    Μετάβαση στο MyGridLayout
                </button>
            </header>
        </Row>
    );
}
