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

  const handleSave = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Type a category for the step.");
      return;
    }
    if (!interviewId) {
      setError("Missing interviewId.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url =
        `${process.env.REACT_APP_BASE_URL}/api/v1/step/interviews/${interviewId}/steps`;

      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() })
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} ${txt}`);
      }

      const data = await r.json();

      const newStep = {
        id: data?.id ?? null,
        title: data?.title ?? title.trim(),
      };

      onCreated && onCreated(newStep);
      reset();
      toggle && toggle();
    } catch (err) {
      console.error(err);
      setError("Failed to create step.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={handleClose} centered>
      <ModalHeader toggle={handleClose}>Create Step</ModalHeader>

      <Form onSubmit={handleSave}>
        <ModalBody>
          {error && <Alert color="danger">{error}</Alert>}

          <FormGroup>
            <Label>Category</Label>
            <Input
              placeholder="e.g., Technical, HR Round…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              “Step 1/2/3…” will be set automatically based on order.
            </div>
          </FormGroup>
        </ModalBody>

        <ModalFooter>
          <Button type="button" color="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" color="primary" disabled={saving}>
            {saving ? <Spinner size="sm" /> : "Create"}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
}
