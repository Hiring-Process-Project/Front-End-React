
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//     Modal,
//     ModalHeader,
//     ModalBody,
//     ModalFooter,
//     Button,
//     Form,
//     FormGroup,
//     Label,
//     Input,
//     Spinner,
// } from "reactstrap";

// const API_BASE = process.env.REACT_APP_API_BASE;

// export default function AddCandidateModal({ isOpen, onClose, jobAdId, onCreated }) {
//     const [firstName, setFirstName] = useState("");
//     const [lastName, setLastName] = useState("");
//     const [email, setEmail] = useState("");
//     const [file, setFile] = useState(null);

//     const [cvOriginalName, setCvOriginalName] = useState("");

//     const [saving, setSaving] = useState(false);
//     const [error, setError] = useState("");

//     const fileRef = useRef(null);

//     useEffect(() => {
//         if (!isOpen) {
//             setFirstName("");
//             setLastName("");
//             setEmail("");
//             setFile(null);
//             setCvOriginalName("");
//             setSaving(false);
//             setError("");
//             if (fileRef.current) fileRef.current.value = "";
//         }
//     }, [isOpen]);

//     const isPdfFile = (f) => {
//         if (!f) return false;
//         const mime = (f.type || "").toLowerCase();
//         if (mime === "application/pdf") return true;
//         const name = (f.name || "").toLowerCase();
//         return name.endsWith(".pdf");
//     };

//     const canSubmit = useMemo(() => {
//         return (
//             firstName.trim() &&
//             lastName.trim() &&
//             email.trim() &&
//             jobAdId &&
//             isPdfFile(file)
//         );
//     }, [firstName, lastName, email, jobAdId, file]);

//     const onPickFile = (e) => {
//         const f = e.target.files?.[0];
//         if (!f) {
//             setFile(null);
//             setCvOriginalName("");
//             setError("CV is required (PDF).");
//             return;
//         }
//         if (!isPdfFile(f)) {
//             setError("Please upload a PDF file.");
//             e.target.value = "";
//             setFile(null);
//             setCvOriginalName("");
//             return;
//         }
//         setError("");
//         setFile(f);
//         setCvOriginalName(f.name || "");
//     };

//     async function uploadCvRequired() {
//         if (!file) throw new Error("CV is required.");
//         const fd = new FormData();
//         fd.append("file", file);
//         const r = await fetch(`${API_BASE}/api/v1/candidates/upload-cv`, {
//             method: "POST",
//             body: fd,
//         });
//         if (!r.ok) throw new Error("CV upload failed");
//         const data = await r.json();
//         if (!data?.path) throw new Error("CV upload response invalid");
//         if (data.originalName) setCvOriginalName(data.originalName);
//         return { path: data.path, originalName: data.originalName || cvOriginalName || "" };
//     }

//     const handleCreate = async (e) => {
//         e?.preventDefault?.();
//         if (!canSubmit || saving) return;
//         setSaving(true);
//         setError("");

//         try {
//             const { path: uploadedPath, originalName } = await uploadCvRequired();

//             const payload = {
//                 firstName: firstName.trim(),
//                 lastName: lastName.trim(),
//                 email: email.trim(),
//                 cvPath: uploadedPath,
//                 cvOriginalName: originalName || cvOriginalName || "",
//                 status: "Pending",
//                 comments: "",
//             };

//             const resp = await fetch(
//                 `${API_BASE}/api/v1/candidates?jobAdId=${encodeURIComponent(jobAdId)}`,
//                 {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify(payload),
//                 }
//             );
//             if (!resp.ok) throw new Error("Create candidate failed");

//             const created = await resp.json();
//             onCreated?.(created);
//             onClose?.();
//         } catch (err) {
//             setError(err.message || "Failed to create candidate.");
//         } finally {
//             setSaving(false);
//         }
//     };

//     return (
//         <Modal isOpen={isOpen} toggle={onClose} centered backdrop="static">
//             <ModalHeader toggle={onClose}>Create Candidate</ModalHeader>
//             <ModalBody>
//                 {error && <div className="alert alert-danger mb-3">{error}</div>}

//                 <Form onSubmit={handleCreate}>
//                     <FormGroup>
//                         <Label>First Name</Label>
//                         <Input
//                             value={firstName}
//                             onChange={(e) => setFirstName(e.target.value)}
//                             placeholder="e.g., John"
//                             required
//                             disabled={saving}
//                         />
//                     </FormGroup>

//                     <FormGroup>
//                         <Label>Last Name</Label>
//                         <Input
//                             value={lastName}
//                             onChange={(e) => setLastName(e.target.value)}
//                             placeholder="e.g., Doe"
//                             required
//                             disabled={saving}
//                         />
//                     </FormGroup>

//                     <FormGroup>
//                         <Label>Email</Label>
//                         <Input
//                             type="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             placeholder="john@example.com"
//                             required
//                             disabled={saving}
//                         />
//                     </FormGroup>

//                     <FormGroup>
//                         <Label>CV (PDF)</Label>
//                         <Input
//                             type="file"
//                             accept="application/pdf,.pdf"
//                             onChange={onPickFile}
//                             innerRef={fileRef}
//                             disabled={saving}
//                             required
//                         />
//                         <small className="text-muted">Required — PDF only.</small>
//                     </FormGroup>
//                 </Form>
//             </ModalBody>
//             <ModalFooter>
//                 <Button color="secondary" onClick={onClose} disabled={saving}>
//                     Cancel
//                 </Button>
//                 <Button color="primary" onClick={handleCreate} disabled={!canSubmit || saving}>
//                     {saving ? <Spinner size="sm" /> : "Create"}
//                 </Button>
//             </ModalFooter>
//         </Modal>
//     );
// }
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Form, FormGroup, Label, Input, Spinner,
} from "reactstrap";

const API_BASE = process.env.REACT_APP_API_BASE;

/* mini i18n (μένει όπως έχεις) */
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

    // ✅ ΝΕΟ: θα εμφανίζουμε εμείς το όνομα αρχείου στα αγγλικά
    const [fileName, setFileName] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fileRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setFirstName("");
            setLastName("");
            setEmail("");
            setFile(null);
            setCvOriginalName("");
            setFileName("");            // ✅ καθάρισμα
            setSaving(false);
            setError("");
            if (fileRef.current) fileRef.current.value = "";
        }
    }, [isOpen]);

    const isPdfFile = (f) => {
        if (!f) return false;
        const mime = (f.type || "").toLowerCase();
        if (mime === "application/pdf") return true;
        const name = (f.name || "").toLowerCase();
        return name.endsWith(".pdf");
    };

    const canSubmit = useMemo(() =>
        firstName.trim() && lastName.trim() && email.trim() && jobAdId && isPdfFile(file),
        [firstName, lastName, email, jobAdId, file]
    );

    const onPickFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) {
            setFile(null);
            setCvOriginalName("");
            setFileName("");            // ✅
            setError(L.err_cv_required);
            return;
        }
        if (!isPdfFile(f)) {
            setError(L.err_pdf_only);
            e.target.value = "";
            setFile(null);
            setCvOriginalName("");
            setFileName("");            // ✅
            return;
        }
        setError("");
        setFile(f);
        setCvOriginalName(f.name || "");
        setFileName(f.name || "");    // ✅ θα εμφανιστεί δίπλα στο κουμπί
    };

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
        if (data.originalName) setCvOriginalName(data.originalName);
        return { path: data.path, originalName: data.originalName || cvOriginalName || "" };
    }

    const handleCreate = async (e) => {
        e?.preventDefault?.();
        if (!canSubmit || saving) return;
        setSaving(true);
        setError("");

        try {
            const { path: uploadedPath, originalName } = await uploadCvRequired();

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
                { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
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

                        {/* 🔒 ΚΡΥΦΟ native input (ελληνικά strings του browser δεν φαίνονται) */}
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

                        {/* ✅ ΔΙΚΟ ΣΟΥ ΑΓΓΛΙΚΟ UI */}
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
