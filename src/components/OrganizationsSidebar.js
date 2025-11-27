import React, { useLayoutEffect, useRef, useState } from "react";
import { Card, CardBody, Row, Col, Button } from "reactstrap";
import "./LeftCard/sidebar.css"; // ίδιο CSS με Departments sidebar

const OrganizationsSidebar = ({
    organizations = [],
    onOrganizationSelect,
    selectedOrganizationId = null,
    onCreateNew,
    bottomReserve = 30,  // μικρό buffer όπως στο άλλο sidebar
}) => {

    const [searchText, setSearchText] = useState("");
    const scrollRef = useRef(null);

    // Φιλτράρισμα όπως στο OccupationSelector
    const filteredOrgs = organizations.filter((org) =>
        org.name.toLowerCase().includes(searchText.toLowerCase())
    );

    // Dynamic height — ίδιο logic με SidebarCard
    useLayoutEffect(() => {
        const fit = () => {
            const el = scrollRef.current;
            if (!el) return;

            const rect = el.getBoundingClientRect();
            const footer = el.parentElement?.querySelector(".org-footer-row");
            const footerH = footer ? footer.getBoundingClientRect().height : 0;
            const parentPB = parseFloat(
                getComputedStyle(el.parentElement).paddingBottom || "0"
            );

            const newHeight =
                window.innerHeight - rect.top - footerH - parentPB - bottomReserve;

            el.style.height = `${Math.max(130, newHeight)}px`;
            el.style.overflowY = "auto";
            el.style.overflowX = "hidden";
        };

        fit();
        window.addEventListener("resize", fit);
        return () => window.removeEventListener("resize", fit);
    }, [bottomReserve]);

    return (
        <Col xs="12" md="4" className="sidebar-col">
            <Card className="shadow-sm sidebar-card" style={{ backgroundColor: "#F6F6F6" }}>
                <CardBody className="sidebar-body">

                    {/* SEARCH BAR — identical to OccupationSelector */}
                    <Row
                        style={{ borderBottom: "1px solid #B7BABC" }}
                        className="pb-2 mb-2"
                    >
                        <Col xs="12" md="6" className="mb-2 mb-md-0">
                            <label className="search-label">Organizations</label>
                        </Col>

                        <Col xs="12" md="6">
                            <input
                                type="text"
                                className="form-control"
                                style={{ borderRadius: "5rem" }}
                                placeholder="Search..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </Col>
                    </Row>

                    {/* SCROLL LIST */}
                    <Row className="sidebar-scroll" ref={scrollRef}>
                        <Col xs="12" style={{ paddingRight: "6px" }}>
                            {filteredOrgs.length === 0 ? (
                                <p style={{ paddingLeft: 5, opacity: 0.7 }}>No results</p>
                            ) : (
                                filteredOrgs.map((org) => {
                                    const active =
                                        Number(selectedOrganizationId) === Number(org.id);
                                    return (
                                        <Button
                                            key={org.id}
                                            block
                                            onClick={() => onOrganizationSelect(org)}
                                            className="org-btn mb-2"
                                            style={{
                                                backgroundColor: active ? "#B7BABC" : "#E9ECEF",
                                                color: active ? "white" : "#333",
                                                border: "none",
                                                borderRadius: "10px",
                                                textAlign: "left",
                                                padding: "12px 16px",
                                                fontSize: "16px",
                                            }}
                                        >
                                            {org.name}
                                        </Button>
                                    );
                                })
                            )}
                        </Col>
                    </Row>

                    {/* FOOTER buttons — identical structure */}
                    <Row className="mt-3 org-footer-row">
                        <Col className="text-center">
                            <Button color="secondary" onClick={onCreateNew}>
                                Create New Organization
                            </Button>
                        </Col>
                    </Row>

                </CardBody>
            </Card>
        </Col>
    );
};

export default OrganizationsSidebar;
