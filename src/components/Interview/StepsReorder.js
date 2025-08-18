import React from "react";
import { Button } from "reactstrap";

export default function StepsReorder({
    steps,                // [{id, title}]  (εδώ title = "Step {i+1}")
    selectedIndex,
    hoveredIndex,
    onSelect,
    onHover,
    onMoveUp,             // (stepId) => void
    onMoveDown            // (stepId) => void
}) {
    return (
        <div className="steps-list">
            {steps.map((s, idx) => {
                const isSelected = idx === selectedIndex;
                const isHovered = idx === hoveredIndex;
                return (
                    <div
                        key={s.id ?? idx}
                        className={`step-item ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`}
                        onMouseEnter={() => onHover?.(idx)}
                        onMouseLeave={() => onHover?.(null)}
                        onClick={() => onSelect?.(idx)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            borderRadius: 10,
                            marginBottom: 8,
                            cursor: "pointer",
                            border: "1px solid #e0e0e0",
                            background: "#f7f7f7",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ opacity: 0.6, minWidth: 24, textAlign: "right" }}>
                                {idx + 1}
                            </span>
                            <span>{s.title}</span>
                        </div>

                        <div style={{ display: "flex", gap: 6 }}>
                            <Button
                                size="sm"
                                outline
                                onClick={(e) => { e.stopPropagation(); onMoveUp?.(s.id); }}
                                disabled={idx === 0}
                                title="Move up"
                            >
                                ▲
                            </Button>
                            <Button
                                size="sm"
                                outline
                                onClick={(e) => { e.stopPropagation(); onMoveDown?.(s.id); }}
                                disabled={idx === steps.length - 1}
                                title="Move down"
                            >
                                ▼
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
