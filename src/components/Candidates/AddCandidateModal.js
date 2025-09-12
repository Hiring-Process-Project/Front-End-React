// // src/components/Candidates/AddCandidateModal.jsx
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

// const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8087";

// export default function AddCandidateModal({ isOpen, onClose, jobAdId, onCreated }) {
//     const [firstName, setFirstName] = useState("");
//     const [lastName, setLastName] = useState("");
//     const [email, setEmail] = useState("");
//     const [file, setFile] = useState(null);

//     const [saving, setSaving] = useState(false);
//     const [error, setError] = useState("");

//     const fileRef = useRef(null);

//     useEffect(() => {
//         if (!isOpen) {
//             setFirstName("");
//             setLastName("");
//             setEmail("");
//             setFile(null);
//             setSaving(false);
//             setError("");
//             if (fileRef.current) fileRef.current.value = "";
//         }
//     }, [isOpen]);

//     // helper: έλεγχος ότι είναι pdf (δέχεται mime ή/και κατάληξη)
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
//             setError("CV is required (PDF).");
//             return;
//         }
//         if (!isPdfFile(f)) {
//             setError("Please upload a PDF file.");
//             e.target.value = "";
//             setFile(null);
//             return;
//         }
//         setError("");
//         setFile(f);
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
//         const data = await r.json(); // { path: "uploads/cv/..." }
//         if (!data?.path) throw new Error("CV upload response invalid");
//         return data.path;
//     }

//     const handleCreate = async (e) => {
//         e?.preventDefault?.();
//         if (!canSubmit || saving) return;
//         setSaving(true);
//         setError("");

//         try {
//             const uploadedPath = await uploadCvRequired();

//             const payload = {
//                 firstName: firstName.trim(),
//                 lastName: lastName.trim(),
//                 email: email.trim(),
//                 cvPath: uploadedPath, // απαιτείται
//                 status: "Pending",     // backend βάζει default, το περνάμε κι εδώ
//                 comments: "",          // κενά σχόλια
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
//                         {/* accept και με .pdf για browsers που δεν στέλνουν σωστό mime */}
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
// src/components/Candidates/AddCandidateModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8087";

export default function AddCandidateModal({ isOpen, onClose, jobAdId, onCreated }) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [file, setFile] = useState(null);

    // ⬇️ ΝΕΟ: κρατάμε και το original name
    const [cvOriginalName, setCvOriginalName] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fileRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setFirstName("");
            setLastName("");
            setEmail("");
            setFile(null);
            setCvOriginalName("");       // reset
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

    const canSubmit = useMemo(() => {
        return (
            firstName.trim() &&
            lastName.trim() &&
            email.trim() &&
            jobAdId &&
            isPdfFile(file)
        );
    }, [firstName, lastName, email, jobAdId, file]);

    const onPickFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) {
            setFile(null);
            setCvOriginalName("");
            setError("CV is required (PDF).");
            return;
        }
        if (!isPdfFile(f)) {
            setError("Please upload a PDF file.");
            e.target.value = "";
            setFile(null);
            setCvOriginalName("");
            return;
        }
        setError("");
        setFile(f);
        setCvOriginalName(f.name || ""); // προ-συμπλήρωση μέχρι να ανέβει
    };

    // ⬇️ ΕΠΙΣΤΡΕΦΕΙ { path, originalName }
    async function uploadCvRequired() {
        if (!file) throw new Error("CV is required.");
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch(`${API_BASE}/api/v1/candidates/upload-cv`, {
            method: "POST",
            body: fd,
        });
        if (!r.ok) throw new Error("CV upload failed");
        const data = await r.json(); // { path, originalName }
        if (!data?.path) throw new Error("CV upload response invalid");
        // ενημέρωσε το state με το originalName από το backend
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
                cvPath: uploadedPath,              // απαιτείται
                cvOriginalName: originalName || cvOriginalName || "", // ⬅️ ΝΕΟ
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
            if (!resp.ok) throw new Error("Create candidate failed");

            const created = await resp.json();
            onCreated?.(created);
            onClose?.();
        } catch (err) {
            setError(err.message || "Failed to create candidate.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={onClose} centered backdrop="static">
            <ModalHeader toggle={onClose}>Create Candidate</ModalHeader>
            <ModalBody>
                {error && <div className="alert alert-danger mb-3">{error}</div>}

                <Form onSubmit={handleCreate}>
                    <FormGroup>
                        <Label>First Name</Label>
                        <Input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="e.g., John"
                            required
                            disabled={saving}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Last Name</Label>
                        <Input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="e.g., Doe"
                            required
                            disabled={saving}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            required
                            disabled={saving}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>CV (PDF)</Label>
                        <Input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={onPickFile}
                            innerRef={fileRef}
                            disabled={saving}
                            required
                        />
                        <small className="text-muted">Required — PDF only.</small>
                    </FormGroup>
                </Form>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button color="primary" onClick={handleCreate} disabled={!canSubmit || saving}>
                    {saving ? <Spinner size="sm" /> : "Create"}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
