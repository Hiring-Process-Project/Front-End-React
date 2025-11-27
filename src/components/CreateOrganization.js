import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Spinner,
} from "reactstrap";

export default function CreateOrganization({
    isOpen,
    toggle,
    baseUrl = "http://localhost:8087",
    onCreated,
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) {
            setName("");
            setDescription("");
            setSaving(false);
            setError("");
        }
    }, [isOpen]);

    const canCreate = name.trim().length > 0;

    const handleCreate = async () => {
        if (!canCreate || saving) return;

        setSaving(true);
        setError("");

        try {
            const payload = {
                name: name.trim(),
                description: description.trim(),
            };

            const res = await fetch(`${baseUrl}/api/v1/organisations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error();

            const created = await res.json();

            // 🔥 Ενημερώνουμε ΜΟΝΟ τον parent
            onCreated?.(created);

        } catch (err) {
            console.error(err);
            setError("Failed to create organization.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered backdrop="static">
            <ModalHeader toggle={toggle}>Create Organization</ModalHeader>

            <ModalBody>
                {error && <div className="alert alert-danger mb-3">{error}</div>}

                <Form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                    <FormGroup>
                        <Label>Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Organization name"
                            disabled={saving}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Description</Label>
                        <Input
                            type="textarea"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={saving}
                            placeholder="Short description..."
                        />
                    </FormGroup>
                </Form>
            </ModalBody>

            <ModalFooter>
                <Button color="secondary" onClick={toggle} disabled={saving}>
                    Cancel
                </Button>
                <Button color="primary" onClick={handleCreate} disabled={!canCreate || saving}>
                    {saving ? <Spinner size="sm" /> : "Create"}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
