import React, { useState } from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input, Button, Alert, Spinner
} from "reactstrap";

export default function AddStepModal({ isOpen, toggle, interviewId, onCreated }) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setTitle("");
    setSaving(false);
    setError("");
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    toggle && toggle();
  };

  const createViaPrimary = async () => {
    const r = await fetch(`http://localhost:8087/interviews/${interviewId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    if (!r.ok) throw new Error("primary-endpoint-failed");
    return r.json().catch(() => ({}));
  };

  const createViaFallback = async () => {
    const r = await fetch(`http://localhost:8087/api/v1/step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviewId, title })
    });
    if (!r.ok) throw new Error("fallback-endpoint-failed");
    return r.json().catch(() => ({}));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Γράψε ένα category για το step.");
      return;
    }
    if (!interviewId) {
      setError("Λείπει το interviewId.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      let data;
      try {
        data = await createViaPrimary();
      } catch {
        data = await createViaFallback();
      }

      const newStep = {
        id: data?.id ?? data?.stepId ?? data?.stepID ?? null,
        title: data?.title ?? data?.tittle ?? title.trim(),
      };
      onCreated && onCreated(newStep);
      reset();
      toggle && toggle();
    } catch (err) {
      console.error(err);
      setError("Αποτυχία δημιουργίας step. Έλεγξε τα endpoints.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={handleClose} centered>
      <ModalHeader toggle={handleClose}>Δημιουργία Step</ModalHeader>
      <Form onSubmit={handleSave}>
        <ModalBody>
          {error && <Alert color="danger" className="mb-3">{error}</Alert>}
          <FormGroup>
            <Label>Category</Label>
            <Input
              placeholder="π.χ. Technical, HR Round…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              style={{ boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              Το «Step 1/2/3…» θα προκύψει αυτόματα από τη σειρά.
            </div>
          </FormGroup>
        </ModalBody>
        <ModalFooter style={{ gap: 8 }}>
          <Button type="button" color="secondary" onClick={handleClose} disabled={saving}>
            Άκυρο
          </Button>
          <Button type="submit" color="primary" disabled={saving}>
            {saving ? <Spinner size="sm" /> : "Δημιουργία"}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
}
