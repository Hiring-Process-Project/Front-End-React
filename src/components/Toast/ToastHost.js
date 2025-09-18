import React from "react";
import "./toast.css";

const TOAST_EVENT = "hf:toast";
const DEFAULT_TTL = 2500;

export default function ToastHost() {
    const [items, setItems] = React.useState([]);

    React.useEffect(() => {
        const onToast = (e) => {
            const { message, type = "success", ttl = DEFAULT_TTL } = e.detail || {};
            const id = Math.random().toString(36).slice(2);
            setItems((prev) => [...prev, { id, message, type }]);
            setTimeout(() => {
                setItems((prev) => prev.filter((x) => x.id !== id));
            }, ttl);
        };
        window.addEventListener(TOAST_EVENT, onToast);
        return () => window.removeEventListener(TOAST_EVENT, onToast);
    }, []);

    // global helper
    React.useEffect(() => {
        window.hfToast = (message, type = "success", ttl = DEFAULT_TTL) => {
            window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type, ttl } }));
        };
    }, []);

    return (
        <div className="hf-toast-container" aria-live="polite" aria-atomic="true">
            {items.map((t) => (
                <div key={t.id} className={`hf-toast ${t.type}`}>
                    {t.type === "success" ? "✔️" : t.type === "error" ? "❌" : "ℹ️"}&nbsp;
                    {t.message}
                </div>
            ))}
        </div>
    );
}
