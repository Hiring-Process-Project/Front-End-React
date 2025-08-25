import React from "react";
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button
} from "reactstrap";

export default function ConfirmModal({
    isOpen,
    title = "Confirm action",
    message = "Are you sure?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmColor = "primary",
    loading = false,
    onConfirm,
    onCancel
}) {
    return (
        <Modal isOpen={isOpen} toggle={onCancel} centered>
            <ModalHeader toggle={onCancel}>{title}</ModalHeader>
            <ModalBody>
                {typeof message === "string" ? <p className="mb-0">{message}</p> : message}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onCancel} disabled={loading}>
                    {cancelText}
                </Button>
                <Button color={confirmColor} onClick={onConfirm} disabled={loading}>
                    {loading ? "Working..." : confirmText}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
