import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from "react";
import { Card, CardBody, Col, Row, Button } from "reactstrap";
import OccupationSelector from "./OccupationSelector";
import CreateJobAd from "./CreateJobAd";
import "./sidebar.css";

const DEFAULT_BASE = "http://localhost:8087";

// ομοιόμορφη κανονικοποίηση strings
const norm = (s) => String(s ?? "").normalize("NFKC").trim().toLowerCase();

/* -------------------- merge helpers (sticky order) -------------------- */
function mergeJobsPreserveOrder(oldJobs, newJobs) {
    const byId = new Map(newJobs.map(x => [Number(x.id), x]));
    const kept = oldJobs
        .filter(x => byId.has(Number(x.id)))
        .map(x => ({ ...x, ...byId.get(Number(x.id)) })); // update fields, κρατά θέση
    const oldIds = new Set(oldJobs.map(x => Number(x.id)));
    const added = newJobs.filter(x => !oldIds.has(Number(x.id)));
    return [...kept, ...added]; // νέες στο τέλος
}

function mergeDepartmentsPreserveOrder(oldDeps, newDeps) {
    const byName = new Map(newDeps.map(d => [d.department, d]));
    const merged = oldDeps.map(od => {
        const nd = byName.get(od.department);
        if (!nd) return od;

        const occByName = new Map(nd.occupations.map(o => [o.name, o]));
        const occs = od.occupations.map(oo => {
            const no = occByName.get(oo.name);
            if (!no) return oo;
            return {
                ...oo,
                id: no.id ?? oo.id,
                jobTitles: mergeJobsPreserveOrder(oo.jobTitles || [], no.jobTitles || []),
            };
        });

        // πρόσθεσε τυχόν νέες occupations στο τέλος
        const oldOccNames = new Set(od.occupations.map(o => o.name));
        const addedOccs = nd.occupations.filter(o => !oldOccNames.has(o.name));
        return { ...od, occupations: [...occs, ...addedOccs] };
    });

    // πρόσθεσε τυχόν νέα departments στο τέλος
    const oldDepNames = new Set(oldDeps.map(d => d.department));
    const addedDeps = newDeps.filter(d => !oldDepNames.has(d.department));
    return [...merged, ...addedDeps];
}

/* -------------------- main component -------------------- */
const SidebarCard = ({
    onJobAdSelect,
    selectedJobAdId,
    baseUrl = DEFAULT_BASE,
    reloadKey = 0,
    onDepartmentSelect,
    selectedDepartmentId = null,
    onOccupationSelect,
    selectedOccupationId = null,
    /** ⬇️ Επιπλέον “ανάσα” κάτω (px). Default: 80 */
    bottomReserve = 80,
}) => {
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const toggleCreate = () => setIsCreateOpen(v => !v);

    // locate full job object by id μέσα από το state
    const findJobById = useCallback((id) => {
        for (const d of departments) {
            for (const o of d.occupations || []) {
                for (const j of o.jobTitles || []) {
                    if (Number(j.id) === Number(id)) {
                        return {
                            id: j.id,
                            title: j.title,
                            status: j.status,
                            departmentId: d.departmentId ?? d.id ?? null,
                            departmentName: d.department,
                            occupationId: o.id ?? null,
                            occupationName: o.name,
                        };
                    }
                }
            }
        }
        return null;
    }, [departments]);

    // ενιαίο API: επιστρέφουμε ΠΑΝΤΑ object (ή null)
    const handleSelectJobAd = useCallback((jobOrId) => {
        if (jobOrId == null) { onJobAdSelect?.(null); return; }
        if (typeof jobOrId === "object") { onJobAdSelect?.(jobOrId); return; }
        const obj = findJobById(jobOrId);
        onJobAdSelect?.(obj ?? { id: Number(jobOrId) || null });
    }, [findJobById, onJobAdSelect]);

    /* -------------------- fetch & group -------------------- */
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
                    deptNameToId = new Map(depList.map(d => [norm(d.name), d.id]));
                }
            } catch { /* no-op */ }

            try {
                const occRes = await fetch(`${baseUrl}/api/v1/occupations/names`, { cache: "no-store" });
                if (occRes.ok) {
                    const occList = await occRes.json();
                    occNameToId = new Map(occList.map(o => [norm(o.name), o.id]));
                }
            } catch { /* no-op */ }

            const grouped = jobs.reduce((acc, item) => {
                const deptName = item.departmentName || "Unassigned";
                const deptId = deptNameToId.get(norm(deptName)) ?? null;

                const occName = item.occupationName || "Other";
                const occId = occNameToId.get(norm(occName)) ?? null;

                if (!acc[deptName]) acc[deptName] = { id: deptId, occupations: {} };
                if (!acc[deptName].occupations[occName]) {
                    acc[deptName].occupations[occName] = { id: occId, jobTitles: [] };
                }
                acc[deptName].occupations[occName].jobTitles.push({
                    id: item.id,
                    title: item.jobTitle,
                    status: item.status,
                    departmentId: deptId,
                    departmentName: deptName,
                    occupationId: occId,
                    occupationName: occName,
                });
                return acc;
            }, {});

            const final = Object.entries(grouped).map(([department, v]) => ({
                department,
                departmentId: v.id,
                occupations: Object.entries(v.occupations).map(([name, info]) => ({
                    id: info.id,
                    name,
                    jobTitles: info.jobTitles,
                })),
            }));

            // sticky merge για να μην αλλάζει η σειρά αν έχουμε ήδη state
            setDepartments(prev => prev.length ? mergeDepartmentsPreserveOrder(prev, final) : final);
            setError(null);
        } catch (err) {
            console.error(err);
            setDepartments([]);
            setError(err);
        }
    }, [baseUrl]);

    useEffect(() => { loadDepartments(); }, [loadDepartments, reloadKey]);

    /* -------------------- in-place update on jobad-updated -------------------- */
    const applyJobStatusInPlace = useCallback((jobId, nextStatus) => {
        setDepartments(prev => {
            let touched = false;
            const next = prev.map(dep => {
                let depTouched = false;
                const occs = (dep.occupations || []).map(occ => {
                    let occTouched = false;
                    const jobs = (occ.jobTitles || []).map(j => {
                        if (Number(j.id) === Number(jobId)) {
                            occTouched = true; depTouched = true; touched = true;
                            return { ...j, status: nextStatus }; // ίδια θέση, νέο status
                        }
                        return j;
                    });
                    return occTouched ? { ...occ, jobTitles: jobs } : occ;
                });
                return depTouched ? { ...dep, occupations: occs } : dep;
            });
            return touched ? next : prev;
        });
    }, []);

    useEffect(() => {
        const onUpdated = (e) => {
            const { id, status } = e.detail || {};
            if (id != null && status) {
                applyJobStatusInPlace(id, status);
            } else {
                // fallback: αν δεν έχουμε id/status, κάνε ελεγχόμενο refetch με sticky merge
                loadDepartments();
            }
        };
        window.addEventListener("hf:jobad-updated", onUpdated);
        return () => window.removeEventListener("hf:jobad-updated", onUpdated);
    }, [applyJobStatusInPlace, loadDepartments]);

    /* -------------------- create flow -------------------- */
    const handleCreated = async (created) => {
        await loadDepartments();
        if (created?.id) onJobAdSelect?.(created.id);
        setIsCreateOpen(false);
    };

    const handleOccupationSelect = (occ) => {
        const obj = (occ && typeof occ === "object") ? occ : { id: Number(occ) || null };
        onOccupationSelect?.(obj);
        onJobAdSelect?.(null);
    };

    /* -------------------- scroller height -------------------- */
    const scrollRef = useRef(null);
    useLayoutEffect(() => {
        const fit = () => {
            const el = scrollRef.current;
            if (!el) return;

            const rect = el.getBoundingClientRect();
            const footer = el.parentElement?.querySelector(".mt-3.row");
            const footerH = footer ? footer.getBoundingClientRect().height : 0;
            const parentPB = parseFloat(getComputedStyle(el.parentElement).paddingBottom || "0");

            const height = window.innerHeight - rect.top - footerH - parentPB - bottomReserve;
            el.style.height = `${Math.max(160, height)}px`;
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
                    {/* ΜΟΝΟ αυτό το Row είναι scroller */}
                    <Row className="sidebar-scroll" ref={scrollRef}>
                        {error ? (
                            <div className="text-center" style={{ width: "100%" }}>
                                <p>Failed to load.</p>
                                <Button size="sm" color="secondary" onClick={loadDepartments}>
                                    Retry
                                </Button>
                            </div>
                        ) : (
                            <OccupationSelector
                                Name="Departments"
                                departments={departments}
                                onJobAdSelect={handleSelectJobAd}
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
                            <Button color="secondary" onClick={toggleCreate}>
                                Create New
                            </Button>
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
};

export default SidebarCard;
