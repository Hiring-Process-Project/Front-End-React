import React, { useState, useMemo } from "react";
import { Col, Row, Button } from "reactstrap";
import "./LeftCard/sidebar.css";

function OrganisationSelector({
    name = "Organisations",
    organisations = [],
    onSelect,
    selectedOrganisationId = null,
}) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return organisations;
        return organisations.filter(o =>
            String(o.name || "").toLowerCase().includes(q)
        );
    }, [organisations, search]);

    return (
        <Col className="d-flex flex-column occ-col" style={{ minHeight: 0 }}>
            {/* Header */}
            <Row
                style={{ borderBottom: "1px solid #B7BABC" }}
                className="pb-2 mb-2"
            >
                <Col xs="12" md="6" className="mb-2 mb-md-0">
                    <label className="search-label">{name}</label>
                </Col>
                <Col xs="12" md="6">
                    <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: "5rem" }}
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </Col>
            </Row>

            {/* Buttons Container (scroll handled by parent .sidebar-scroll) */}
            <div style={{ flex: 1, minHeight: 0 }}>
                {filtered.length === 0 ? (
                    <p style={{ paddingLeft: 8 }}>No results.</p>
                ) : (
                    filtered.map((org) => {
                        const active = Number(org.id) === Number(selectedOrganisationId);
                        return (
                            <Button
                                key={org.id}
                                block
                                onClick={() => onSelect?.(org)}
                                className="org-btn"
                                style={{
                                    textAlign: "left",
                                    marginBottom: 6,
                                    backgroundColor: active ? "#B7BABC" : "#E9ECEF",
                                    color: active ? "white" : "black",
                                    border: "none",
                                    borderRadius: "8px",
                                }}
                            >
                                {org.name}
                            </Button>
                        );
                    })
                )}
            </div>
        </Col>
    );
}

export default OrganisationSelector;
