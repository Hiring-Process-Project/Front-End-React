import React, { useEffect, useMemo, useState } from "react";
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Form, FormGroup, Label, Input, Spinner
} from "reactstrap";

export default function CreateJobAd({ isOpen, toggle, baseUrl = "http://localhost:8087", onCreated }) {
    const [name, setName] = useState("");
    const [deptId, setDeptId] = useState("");
    const [occId, setOccId] = useState("");

    const [departments, setDepartments] = useState([]); // [{id,name,occupations:[{id,name}]}]
    const [occupations, setOccupations] = useState([]); // all occupations

    const [loadingDeps, setLoadingDeps] = useState(false);
    const [loadingOccs, setLoadingOccs] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // NEW: search filters
    const [deptQuery, setDeptQuery] = useState("");
    const [occQuery, setOccQuery] = useState("");

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
            .catch(() => setError("Αποτυχία φόρτωσης departments."))
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
                setOccupations(mapped);
            })
            .catch(() => setError("Αποτυχία φόρτωσης occupations."))
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
            let r = await fetch(`${baseUrl}/api/v1/departments/${deptId}/occupations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ occupationId: occId })
            });

            // 2) fallback
            if (!r.ok) {
                r = await fetch(`${baseUrl}/api/v1/departments/${deptId}/occupations/${occId}`, { method: "POST" });
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

            await ensureDepartmentHasOccupation(deptId, occId);

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
            setError("Αποτυχία δημιουργίας Job Ad.");
        } finally {
            setSaving(false);
        }
    };

    // Filtered options (αναζήτηση)
    const filteredDepartments = useMemo(() => {
        const q = deptQuery.trim().toLowerCase();
        if (!q) return departments;
        return departments.filter(d => d.name.toLowerCase().includes(q));
    }, [deptQuery, departments]);

    const filteredOccupations = useMemo(() => {
        const q = occQuery.trim().toLowerCase();
        if (!q) return occupations;
        return occupations.filter(o => o.name.toLowerCase().includes(q));
    }, [occQuery, occupations]);

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered backdrop="static" keyboard>
            <ModalHeader toggle={toggle}>Δημιουργία Job Ad</ModalHeader>
            <ModalBody>
                {error && <div className="mb-3 alert alert-danger">{error}</div>}

                <Form onSubmit={handleCreate}>
                    <FormGroup>
                        <Label>Όνομα (Title)</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="π.χ. Junior Mechanical Engineer"
                            required
                            disabled={saving}
                        />
                    </FormGroup>

                    {/* Department + Search */}
                    <FormGroup>
                        <Label>Department</Label>
                        <div className="d-flex gap-2 flex-column flex-md-row">
                            <Input
                                placeholder="Αναζήτηση department…"
                                value={deptQuery}
                                onChange={(e) => setDeptQuery(e.target.value)}
                                disabled={loadingDeps || saving}
                            />
                            <Input
                                type="select"
                                value={deptId}
                                onChange={e => {
                                    setDeptId(e.target.value);
                                    // reset occupation if dept changes
                                    setOccId("");
                                }}
                                disabled={saving || loadingDeps}
                            >
                                <option value="">
                                    {loadingDeps ? "Φόρτωση..." : "— επίλεξε department —"}
                                </option>
                                {filteredDepartments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </Input>
                        </div>
                    </FormGroup>

                    {/* Occupation + Search */}
                    <FormGroup>
                        <Label>Occupation</Label>
                        <div className="d-flex gap-2 flex-column flex-md-row">
                            <Input
                                placeholder="Αναζήτηση occupation…"
                                value={occQuery}
                                onChange={(e) => setOccQuery(e.target.value)}
                                disabled={!deptId || loadingOccs || saving}
                            />
                            <Input
                                type="select"
                                value={occId}
                                onChange={e => setOccId(e.target.value)}
                                disabled={!deptId || saving || loadingOccs}
                            >
                                <option value="">
                                    {!deptId ? "επέλεξε πρώτα department" : (loadingOccs ? "Φόρτωση..." : "— επίλεξε occupation —")}
                                </option>
                                {filteredOccupations.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </Input>
                        </div>
                    </FormGroup>
                </Form>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle} disabled={saving}>Άκυρο</Button>
                <Button color="primary" onClick={handleCreate} disabled={!canCreate || saving}>
                    {saving ? <Spinner size="sm" /> : "Δημιουργία"}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
