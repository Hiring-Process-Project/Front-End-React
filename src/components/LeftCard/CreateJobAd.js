import React, { useEffect, useMemo, useState, useRef } from "react";
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Form, FormGroup, Label, Input, Spinner
} from "reactstrap";

export default function CreateJobAd({ isOpen, toggle, baseUrl = process.env.REACT_APP_BASE_URL, onCreated }) {
    const [name, setName] = useState("");
    const [deptId, setDeptId] = useState("");
    const [occId, setOccId] = useState("");

    const [departments, setDepartments] = useState([]); // [{id,name,occupations:[{id,name}]}]
    const [occupations, setOccupations] = useState([]); // [{id,name}]

    const [loadingDeps, setLoadingDeps] = useState(false);
    const [loadingOccs, setLoadingOccs] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // search filters + focus state
    const [deptQuery, setDeptQuery] = useState("");
    const [occQuery, setOccQuery] = useState("");
    const [deptOpen, setDeptOpen] = useState(false);
    const [occOpen, setOccOpen] = useState(false);

    // keyboard nav indices
    const [deptHi, setDeptHi] = useState(-1);
    const [occHi, setOccHi] = useState(-1);

    const deptWrapRef = useRef(null);
    const occWrapRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        setLoadingDeps(true);
        setError("");

        fetch(`${baseUrl}/api/v1/departments/names`)
            .then(r => r.json())
            .then(data => {
                const mapped = (Array.isArray(data) ? data : []).map(d => ({
                    id: d.id,
                    name: d.name,
                    occupations: Array.isArray(d.occupations)
                        ? d.occupations.map(o => ({ id: o.id, name: o.name }))
                        : []
                }));
                setDepartments(mapped);
            })
            .catch(() => setError("Failed to load departments."))
            .finally(() => setLoadingDeps(false));
    }, [isOpen, baseUrl]);

    useEffect(() => {
        if (!isOpen) return;
        setLoadingOccs(true);
        fetch(`${baseUrl}/api/v1/occupations/names`)
            .then(r => r.json())
            .then(data => {
                const mapped = (Array.isArray(data) ? data : [])
                    .map(o => ({ id: o.id, name: o.title ?? o.name ?? "" }))
                    .filter(o => o.name);
                mapped.sort((a, b) => a.name.localeCompare(b.name));
                console.log(mapped);
                setOccupations(mapped);
            })
            .catch(() => setError("Failed to load occupations."))
            .finally(() => setLoadingOccs(false));
    }, [isOpen, baseUrl]);

    // Reset όταν κλείνει
    useEffect(() => {
        if (!isOpen) {
            setName("");
            setDeptId("");
            setOccId("");
            setDeptQuery("");
            setOccQuery("");
            setDeptOpen(false);
            setOccOpen(false);
            setDeptHi(-1);
            setOccHi(-1);
            setError("");
            setSaving(false);
        }
    }, [isOpen]);

    const canCreate = name.trim() && deptId && occId;

    // Αν η occupation δεν ανήκει στο department, προσπάθησε να τη συνδέσεις
    const ensureDepartmentHasOccupation = async (deptId, occId) => {
        const dep = departments.find(d => String(d.id) === String(deptId));
        const alreadyHas = dep?.occupations?.some(o => String(o.id) === String(occId));
        if (alreadyHas) return;

        try {
            // 1) πιθανό endpoint
            let r = await fetch(`${baseUrl}/api/v1/departments/${deptId}/occupations`, { //TODO failed request Method not allowed
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ occupationId: occId })
            });

            // 2) fallback
            if (!r.ok) {
                r = await fetch(`${baseUrl}/api/v1/departments/${deptId}/occupations/${occId}`, { method: "POST" }); //TODO failed request
            }

            if (r.ok) {
                // ενημέρωσε τοπικά
                setDepartments(prev => prev.map(d => {
                    if (String(d.id) !== String(deptId)) return d;
                    const exists = d.occupations?.some(o => String(o.id) === String(occId));
                    if (exists) return d;
                    const occ = occupations.find(o => String(o.id) === String(occId));
                    return { ...d, occupations: [...(d.occupations || []), occ || { id: occId, name: "(unknown)" }] };
                }));
            }
        } catch {
            // ignore
        }
    };

    const handleCreate = async e => {
        e?.preventDefault?.();
        if (!canCreate || saving) return;

        setSaving(true);
        setError("");

        try {
            const deptName = departments.find(d => String(d.id) === String(deptId))?.name ?? "";
            const occName = occupations.find(o => String(o.id) === String(occId))?.name ?? "";

            const payload = {
                title: name.trim(),
                description: "",
                status: "Pending",
                publishDate: new Date().toISOString().split("T")[0],
                departmentName: deptName,
                occupationTitle: occName
            };

            const r = await fetch(`${baseUrl}/jobAds/by-names`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!r.ok) throw new Error();

            const created = await r.json();
            onCreated?.(created);
            setTimeout(() => toggle?.(), 0);

        } catch {
            setError("Job Ad creation failed.");
        } finally {
            setSaving(false);
        }
    };


    // Filtered options (αναζήτηση) – limit για να μη γίνονται τεράστιες λίστες
    const filteredDepartments = useMemo(() => {
        const q = deptQuery.trim().toLowerCase();
        const arr = !q ? departments : departments.filter(d => d.name.toLowerCase().includes(q));
        return arr.slice(0, 12);
    }, [deptQuery, departments]);

    const filteredOccupations = useMemo(() => {
        const q = occQuery.trim().toLowerCase();
        return !q ? occupations : occupations.filter(o =>
            o.name.toLowerCase().includes(q)
        );
    }, [occQuery, occupations]);


    // Επιλογές με click
    const pickDepartment = (d) => {
        setDeptId(String(d.id));
        setDeptQuery(d.name);
        setDeptOpen(false);
        // reset occupation όταν αλλάζει department
        setOccId("");
        setOccQuery("");
        setOccOpen(false);
        setDeptHi(-1);
    };

    const pickOccupation = (o) => {
        setOccId(String(o.id));
        setOccQuery(o.name);
        setOccOpen(false);
        setOccHi(-1);
    };

    // Keyboard handlers (↑ / ↓ / Enter / Esc)
    const onDeptKeyDown = (e) => {
        if (!deptOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) setDeptOpen(true);
        if (!deptOpen) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setDeptHi((i) => Math.min(i + 1, filteredDepartments.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setDeptHi((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const item = filteredDepartments[Math.max(0, deptHi)];
            if (item) pickDepartment(item);
        } else if (e.key === "Escape") {
            setDeptOpen(false);
            setDeptHi(-1);
        }
    };

    const onOccKeyDown = (e) => {
        if (!occOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) setOccOpen(true);
        if (!occOpen) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOccHi((i) => Math.min(i + 1, filteredOccupations.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setOccHi((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const item = filteredOccupations[Math.max(0, occHi)];
            if (item) pickOccupation(item);
        } else if (e.key === "Escape") {
            setOccOpen(false);
            setOccHi(-1);
        }
    };

    // click έξω κλείνει τις λίστες
    useEffect(() => {
        const onDocClick = (e) => {
            if (deptWrapRef.current && !deptWrapRef.current.contains(e.target)) {
                setDeptOpen(false);
                setDeptHi(-1);
            }
            if (occWrapRef.current && !occWrapRef.current.contains(e.target)) {
                setOccOpen(false);
                setOccHi(-1);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered backdrop="static" keyboard>
            <ModalHeader toggle={toggle}>Create Job Ad</ModalHeader>
            <ModalBody>
                {error && <div className="mb-3 alert alert-danger">{error}</div>}

                <Form onSubmit={handleCreate}>
                    <FormGroup>
                        <Label>Name (Title)</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Junior Mechanical Engineer"
                            required
                            disabled={saving}
                        />
                    </FormGroup>

                    {/* Department: input με προτάσεις από κάτω */}
                    <FormGroup>
                        <Label>Department</Label>
                        <div ref={deptWrapRef} style={{ position: "relative" }}>
                            <Input
                                placeholder={loadingDeps ? "Loading..." : "Search department…"}
                                value={deptQuery}
                                onChange={(e) => {
                                    setDeptQuery(e.target.value);
                                    setDeptOpen(true);
                                    setDeptHi(-1);
                                }}
                                onFocus={() => setDeptOpen(true)}
                                onKeyDown={onDeptKeyDown}
                                disabled={loadingDeps || saving}
                                autoComplete="off"
                            />
                            {deptOpen && (
                                <div
                                    className="typeahead-list"
                                    style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        zIndex: 1050,
                                        background: "#fff",
                                        border: "1px solid #dcdcdc",
                                        borderRadius: 8,
                                        marginTop: 4,
                                        maxHeight: 240,
                                        overflowY: "auto",
                                        boxShadow: "0 6px 18px rgba(0,0,0,.08)"
                                    }}
                                >
                                    {filteredDepartments.length === 0 && (
                                        <div style={{ padding: "8px 10px", color: "#777" }}>
                                            {deptQuery.trim() ? "No matches." : "— type to search —"}
                                        </div>
                                    )}
                                    {filteredDepartments.map((d, i) => (
                                        <div
                                            key={d.id}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => pickDepartment(d)}
                                            className="typeahead-item"
                                            style={{
                                                padding: "8px 10px",
                                                cursor: "pointer",
                                                background: i === deptHi ? "#f3f6ff" : "transparent"
                                            }}
                                            onMouseEnter={() => setDeptHi(i)}
                                        >
                                            {d.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </FormGroup>

                    {/* Occupation: input με προτάσεις από κάτω */}
                    <FormGroup>
                        <Label>Occupation</Label>
                        <div ref={occWrapRef} style={{ position: "relative" }}>
                            <Input
                                placeholder={!deptId ? "Choose a department first" : (loadingOccs ? "Loading..." : "Search occupation…")}
                                value={occQuery}
                                onChange={(e) => {
                                    setOccQuery(e.target.value);
                                    setOccOpen(true);
                                    setOccHi(-1);
                                }}
                                onFocus={() => deptId && setOccOpen(true)}
                                onKeyDown={onOccKeyDown}
                                disabled={!deptId || loadingOccs || saving}
                                autoComplete="off"
                            />
                            {occOpen && (
                                <div
                                    className="typeahead-list"
                                    style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        zIndex: 1050,
                                        background: "#fff",
                                        border: "1px solid #dcdcdc",
                                        borderRadius: 8,
                                        marginTop: 4,
                                        maxHeight: 240,
                                        overflowY: "auto",
                                        boxShadow: "0 6px 18px rgba(0,0,0,.08)"
                                    }}
                                >
                                    {filteredOccupations.length === 0 && (
                                        <div style={{ padding: "8px 10px", color: "#777" }}>
                                            {occQuery.trim() ? "No matches." : "— type to search —"}
                                        </div>
                                    )}
                                    {filteredOccupations.map((o, i) => (
                                        <div
                                            key={o.id}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => pickOccupation(o)}
                                            className="typeahead-item"
                                            style={{
                                                padding: "8px 10px",
                                                cursor: "pointer",
                                                background: i === occHi ? "#f3f6ff" : "transparent"
                                            }}
                                            onMouseEnter={() => setOccHi(i)}
                                        >
                                            {o.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </FormGroup>
                </Form>
            </ModalBody>

            <ModalFooter>
                <Button color="secondary" onClick={toggle} disabled={saving}>Cancel</Button>
                <Button color="primary" onClick={handleCreate} disabled={!canCreate || saving}>
                    {saving ? <Spinner size="sm" /> : "Create"}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
