import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Form, FormGroup, Label, Input, Spinner,
} from "reactstrap";

const API_BASE = process.env.REACT_APP_BASE_URL;

// Simple i18n dictionary for labels and error messages
const STR = {
    en: {
        title: "Create Candidate",
        firstName: "First Name",
        firstName_ph: "e.g., John",
        lastName: "Last Name",
        lastName_ph: "e.g., Doe",
        email: "Email",
        email_ph: "john@example.com",
        cv: "CV (PDF)",
        cv_hint: "Required — PDF only.",
        btn_cancel: "Cancel",
        btn_create: "Create",
        err_cv_required: "CV is required (PDF).",
        err_pdf_only: "Please upload a PDF file.",
        err_cv_upload: "CV upload failed",
        err_cv_response: "CV upload response invalid",
        err_create: "Failed to create candidate.",
    },
    el: { /* ... */ },
};

export default function AddCandidateModal({
    isOpen,
    onClose,
    jobAdId,
    onCreated,
    lang = "en",
}) {

    const L = STR[lang] || STR.en;
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [file, setFile] = useState(null);
    const [cvOriginalName, setCvOriginalName] = useState("");
    const [fileName, setFileName] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef(null);

    // Reset form state whenever the modal is closed
    useEffect(() => {
        if (!isOpen) {
            setFirstName("");
            setLastName("");
            setEmail("");
            setFile(null);
            setCvOriginalName("");
            setFileName("");
            setSaving(false);
            setError("");

            // Clear the file input value manually
            if (fileRef.current) fileRef.current.value = "";
        }
    }, [isOpen]);

    // Helper: check if a file is a PDF (by MIME type or extension)
    const isPdfFile = (f) => {
        if (!f) return false;
        const mime = (f.type || "").toLowerCase();
        if (mime === "application/pdf") return true;
        const name = (f.name || "").toLowerCase();
        return name.endsWith(".pdf");
    };

    // Determine if the form can be submitted
    const canSubmit = useMemo(() =>
        firstName.trim() &&
        lastName.trim() &&
        email.trim() &&
        jobAdId &&
        isPdfFile(file),
        [firstName, lastName, email, jobAdId, file]
    );

    // Handle file selection from the file input
    const onPickFile = (e) => {
        const f = e.target.files?.[0];

        // No file selected
        if (!f) {
            setFile(null);
            setCvOriginalName("");
            setFileName("");
            setError(L.err_cv_required);
            return;
        }

        // Reject non-PDF files
        if (!isPdfFile(f)) {
            setError(L.err_pdf_only);
            e.target.value = "";
            setFile(null);
            setCvOriginalName("");
            setFileName("");
            return;
        }

        // Valid PDF file
        setError("");
        setFile(f);
        setCvOriginalName(f.name || "");
        setFileName(f.name || "");
    };

    // Upload the CV file to the backend (required step)
    async function uploadCvRequired() {
        if (!file) throw new Error(L.err_cv_required);

        const fd = new FormData();
        fd.append("file", file);

        const r = await fetch(`${API_BASE}/api/v1/candidates/upload-cv`, {
            method: "POST",
            body: fd,
        });

        if (!r.ok) throw new Error(L.err_cv_upload);

        const data = await r.json();
        if (!data?.path) throw new Error(L.err_cv_response);

        // Update original filename if provided by the backend
        if (data.originalName) setCvOriginalName(data.originalName);

        return {
            path: data.path,
            originalName: data.originalName || cvOriginalName || "",
        };
    }

    // Main submit handler: upload CV first, then create candidate
    const handleCreate = async (e) => {
        e?.preventDefault?.();
        if (!canSubmit || saving) return;

        setSaving(true);
        setError("");

        try {
            // Step 1: upload CV
            const { path: uploadedPath, originalName } = await uploadCvRequired();

            // Step 2: create candidate record
            const payload = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                cvPath: uploadedPath,
                cvOriginalName: originalName || cvOriginalName || "",
                status: "Pending",
                comments: "",
            };

            const resp = await fetch(
                `${API_BASE}/api/v1/candidates?jobAdId=${encodeURIComponent(jobAdId)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!resp.ok) throw new Error(L.err_create);

            const created = await resp.json();

            onCreated?.(created);
            onClose?.();
        } catch (err) {
            setError(err.message || L.err_create);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={onClose} centered backdrop="static">
            <ModalHeader toggle={onClose}>{L.title}</ModalHeader>

            <ModalBody>
                {error && <div className="alert alert-danger mb-3">{error}</div>}

                <Form onSubmit={handleCreate}>
                    <FormGroup>
                        <Label>{L.firstName}</Label>
                        <Input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder={L.firstName_ph}
                            required
                            disabled={saving}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>{L.lastName}</Label>
                        <Input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder={L.lastName_ph}
                            required
                            disabled={saving}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>{L.email}</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={L.email_ph}
                            required
                            disabled={saving}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>{L.cv}</Label>

                        {/* Hidden native file input */}
                        <Input
                            id="cvFile"
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={onPickFile}
                            innerRef={fileRef}
                            disabled={saving}
                            required
                            style={{ display: "none" }}
                        />

                        {/* Custom file picker UI */}
                        <div className="d-flex align-items-center gap-2">
                            <Button
                                type="button"
                                color="secondary"
                                onClick={() => fileRef.current?.click()}
                                disabled={saving}
                            >
                                Choose file
                            </Button>
                            <span className="text-muted">
                                {fileName ? fileName : "No file chosen."}
                            </span>
                        </div>

                        <small className="text-muted">{L.cv_hint}</small>
                    </FormGroup>
                </Form>
            </ModalBody>

            <ModalFooter>
                <Button color="secondary" onClick={onClose} disabled={saving}>
                    {L.btn_cancel}
                </Button>
                <Button color="primary" onClick={handleCreate} disabled={!canSubmit || saving}>
                    {saving ? <Spinner size="sm" /> : L.btn_create}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
