import React, { useEffect, useMemo, useState } from "react";
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Form, FormGroup, Label, Input, FormFeedback, Spinner
} from "reactstrap";

export default function CreateJobAd({ isOpen, toggle, baseUrl = "http://localhost:8087", onCreated }) {
    const [name, setName] = useState("");
    const [deptId, setDeptId] = useState("");
    const [occId, setOccId] = useState("");

    const [departments, setDepartments] = useState([]);      // [{id,name,occupations:[{id,name}]}]
    const [occupations, setOccupations] = useState([]);      // <-- από /api/v1/occupations/names

    const [loadingDeps, setLoadingDeps] = useState(false);
    const [loadingOccs, setLoadingOccs] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Φόρτωση departments
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

    // Φόρτωση ΟΛΩΝ των occupations από /api/v1/occupations/names
    useEffect(() => {
        if (!isOpen) return;
        setLoadingOccs(true);
        fetch(`${baseUrl}/api/v1/occupations/names`)
            .then(r => r.json())
            .then(data => {
                const mapped = (Array.isArray(data) ? data : [])
                    .map(o => ({ id: o.id, name: o.title ?? o.name ?? "" }))
                    .filter(o => o.name);
                // sort αλφαβητικά
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
            setError("");
            setSaving(false);
        }
    }, [isOpen]);

    const canCreate = name.trim() && deptId && occId;

    // Αν η occupation δεν ανήκει σε αυτό το department, προσπάθησε να τη συνδέσεις
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
                // ενημέρωσε τοπικά για να φανεί στα tabs
                setDepartments(prev => prev.map(d => {
                    if (String(d.id) !== String(deptId)) return d;
                    const exists = d.occupations?.some(o => String(o.id) === String(occId));
                    if (exists) return d;
                    const occ = occupations.find(o => String(o.id) === String(occId));
                    return { ...d, occupations: [...(d.occupations || []), occ || { id: occId, name: "(unknown)" }] };
                }));
            }
        } catch {
            // ignore: δεν μπλοκάρουμε τη δημιουργία
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

            // πρώτα προσπάθησε να τη "δέσεις" με το department (αν δεν υπάρχει)
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

    const departmentOptions = useMemo(
        () => departments.map(d => ({ value: d.id, label: d.name })),
        [departments]
    );

    // ΠΡΟΕΡΧΟΝΤΑΙ από /api/v1/occupations/names (όλες)
    const occupationOptions = useMemo(
        () => occupations.map(o => ({ value: o.id, label: o.name })),
        [occupations]
    );

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
                        <FormFeedback>Δώσε όνομα.</FormFeedback>
                    </FormGroup>

                    <FormGroup>
                        <Label>Department</Label>
                        <Input
                            type="select"
                            value={deptId}
                            onChange={e => setDeptId(e.target.value)}
                            disabled={saving || loadingDeps}
                        >
                            <option value="">{loadingDeps ? "Φόρτωση..." : "— επίλεξε department —"}</option>
                            {departmentOptions.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </Input>
                    </FormGroup>

                    <FormGroup>
                        <Label>Occupation</Label>
                        <Input
                            type="select"
                            value={occId}
                            onChange={e => setOccId(e.target.value)}
                            disabled={!deptId || saving || loadingOccs}
                        >
                            <option value="">
                                {!deptId ? "επέλεξε πρώτα department" : (loadingOccs ? "Φόρτωση..." : "— επίλεξε occupation —")}
                            </option>
                            {occupationOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </Input>
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
