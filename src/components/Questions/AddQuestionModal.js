import React, { useMemo, useState } from "react";
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Form, FormGroup, Label, Input, Button, Alert, Spinner
} from "reactstrap";


export default function AddQuestionModal({
    isOpen,
    toggle,
    steps = [],
    defaultStepId,
    onCreated
}) {
    const [stepId, setStepId] = useState(defaultStepId ?? steps[0]?.id ?? null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const options = useMemo(() => steps.filter((s) => s?.id != null), [steps]);

    const reset = () => {
        setName("");
        setDescription("");
        setError("");
        setSaving(false);
        setStepId(defaultStepId ?? steps[0]?.id ?? null);
    };

    const handleClose = () => {
        if (saving) return;
        reset();
        toggle && toggle();
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!stepId) {
            setError("Διάλεξε ένα step.");
            return;
        }
        if (!name.trim()) {
            setError("Γράψε το κείμενο της ερώτησης.");
            return;
        }

        setSaving(true);
        setError("");
        try {
            const r = await fetch(`http://localhost:8087/api/v1/step/${stepId}/questions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), description: description.trim() }),
            });
            if (!r.ok) throw new Error("create-question-failed");
            const data = await r.json().catch(() => ({}));
            const created = {
                id: data?.id ?? null,
                name: data?.name ?? name.trim(),
                description: data?.description ?? description.trim(),
            };
            onCreated && onCreated({ stepId, question: created });
            reset();
            toggle && toggle();
        } catch (err) {
            console.error(err);
            setError("Αποτυχία δημιουργίας question.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={handleClose} centered>
            <ModalHeader toggle={handleClose}>Προσθήκη Question</ModalHeader>
            <Form onSubmit={handleSave}>
                <ModalBody>
                    {error && <Alert color="danger" className="mb-3">{error}</Alert>}

                    <FormGroup>
                        <Label>Step</Label>
                        <Input
                            type="select"
                            value={stepId ?? ""}
                            onChange={(e) => setStepId(Number(e.target.value))}
                            disabled={saving || options.length === 0}
                        >
                            {options.length === 0 && <option value="">— κανένα step —</option>}
                            {options.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title || "(Untitled step)"}
                                </option>
                            ))}
                        </Input>
                    </FormGroup>

                    <FormGroup>
                        <Label>Question</Label>
                        <Input
                            placeholder="Γράψε την ερώτηση…"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={saving}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Περιγραφή (προαιρετική)</Label>
                        <Input
                            type="textarea"
                            rows={4}
                            placeholder="Λεπτομέρειες / σημειώσεις…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={saving}
                        />
                    </FormGroup>
                </ModalBody>

                <ModalFooter>
                    <Button type="button" color="secondary" onClick={handleClose} disabled={saving}>
                        Άκυρο
                    </Button>
                    <Button type="submit" color="primary" disabled={saving || options.length === 0}>
                        {saving ? <Spinner size="sm" /> : "Δημιουργία"}
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
}
