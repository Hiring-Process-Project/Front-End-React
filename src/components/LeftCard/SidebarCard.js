import React, { useEffect, useState, useCallback } from "react";
import { Card, CardBody, Col, Row, Button } from "reactstrap";
import OccupationSelector from "./OccupationSelector";
import CreateJobAd from "./CreateJobAd";
import "./sidebar.css";

const DEFAULT_BASE = "http://localhost:8087";

const SidebarCard = ({
    onJobAdSelect,
    selectedJobAdId,
    baseUrl = DEFAULT_BASE,
    reloadKey = 0,
    onDepartmentSelect,
    selectedDepartmentId = null,
    onOccupationSelect,
    selectedOccupationId = null,
}) => {
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const toggleCreate = () => setIsCreateOpen((v) => !v);

    const loadDepartments = useCallback(async () => {
        try {
            const jobsRes = await fetch(`${baseUrl}/jobAds`, { cache: "no-store" });
            if (!jobsRes.ok) throw new Error("Failed to fetch job ads");
            const jobs = await jobsRes.json();

            let deptNameToId = new Map();
            let occNameToId = new Map();

            try {
                const depRes = await fetch(`${baseUrl}/api/v1/departments/names`, { cache: "no-store" });
                if (depRes.ok) {
                    const depList = await depRes.json();
                    deptNameToId = new Map(depList.map((d) => [d.name, d.id]));
                }
            } catch { }

            try {
                const occRes = await fetch(`${baseUrl}/api/v1/occupations/names`, { cache: "no-store" });
                if (occRes.ok) {
                    const occList = await occRes.json();
                    occNameToId = new Map(occList.map((o) => [o.name, o.id]));
                }
            } catch { }

            const grouped = jobs.reduce((acc, item) => {
                const deptName = item.departmentName || "Unassigned";
                const deptId = deptNameToId.get(deptName) ?? null;

                const occName = item.occupationName || "Other";
                const occId = occNameToId.get(occName) ?? null;

                if (!acc[deptName]) acc[deptName] = { id: deptId, occupations: {} };
                if (!acc[deptName].occupations[occName]) {
                    acc[deptName].occupations[occName] = { id: occId, jobTitles: [] };
                }
                acc[deptName].occupations[occName].jobTitles.push({
                    id: item.id,
                    title: item.jobTitle,
                    status: item.status,
                });
                return acc;
            }, {});

            const final = Object.entries(grouped).map(([deptName, v]) => ({
                department: deptName,
                departmentId: v.id,
                occupations: Object.entries(v.occupations).map(([name, info]) => ({
                    id: info.id,
                    name,
                    jobTitles: info.jobTitles,
                })),
            }));

            setDepartments(final);
            setError(null);
        } catch (err) {
            console.error(err);
            setDepartments([]);
            setError(err);
        }
    }, [baseUrl]);

    useEffect(() => {
        loadDepartments();
    }, [loadDepartments, reloadKey]);

    useEffect(() => {
        const onUpdated = () => loadDepartments();
        window.addEventListener("hf:jobad-updated", onUpdated);
        return () => window.removeEventListener("hf:jobad-updated", onUpdated);
    }, [loadDepartments]);

    const handleCreated = async (created) => {
        await loadDepartments();
        if (created?.id) onJobAdSelect?.(created.id);
        setIsCreateOpen(false);
    };

<<<<<<< HEAD
    // useEffect(() => {
    //     const onJobAdUpdated = (e) => {
    //         // κάθε φορά που έρχεται ενημέρωση, ξαναφόρτωσε τη λίστα
    //         loadDepartments();
    //     };
    //     window.addEventListener("hf:jobad-updated", onJobAdUpdated);
    //     return () => window.removeEventListener("hf:jobad-updated", onJobAdUpdated);
    // }, []);


=======
    const handleOccupationSelect = (occ) => {
        onOccupationSelect?.(occ);
        onJobAdSelect?.(null);
    };
>>>>>>> 5abcecdd1f5d9d0f92c9c425063dfa0f51f0e69b
    return (
        <Col xs="12" md="4" className="sidebar-col">   {/* ⬅ */}
            <Card
                className="shadow-sm sidebar-card"  // ⬅
                style={{ backgroundColor: "#F6F6F6" }}
            >
                <CardBody className="sidebar-body"> {/* ⬅ */}
                    <Row className="sidebar-scroll">   {/* ⬅ κάνει fill + scroll περιεχόμενο */}
                        {error ? (
                            <div className="text-center" style={{ width: "100%" }}>
                                <p>Σφάλμα φόρτωσης.</p>
                                <Button size="sm" color="secondary" onClick={loadDepartments}>
                                    Retry
                                </Button>
                            </div>
                        ) : (
                            <OccupationSelector
                                Name="Departments"
                                departments={departments}
                                onJobAdSelect={onJobAdSelect}
                                selectedJobAdId={selectedJobAdId}
                                onDepartmentSelect={onDepartmentSelect}
                                selectedDepartmentId={selectedDepartmentId}
                                onOccupationSelect={handleOccupationSelect}
                                selectedOccupationId={selectedOccupationId}
                            />
                        )}
                    </Row>

                    <Row className="mt-3">
                        <Col className="text-center">
                            <Button color="secondary" onClick={toggleCreate}>Create New</Button>
                        </Col>
                    </Row>

                    <CreateJobAd
                        isOpen={isCreateOpen}
                        toggle={toggleCreate}
                        baseUrl={baseUrl}
                        onCreated={handleCreated}
                    />
                </CardBody>
            </Card>
        </Col>
    );
}

export default SidebarCard;
