import React, { useState } from "react";
import Steps from "../Steps";

function InterviewSteps({
    interviewsteps,
    category,
    onSelect,
    selectedIndex: controlledSelectedIndex,
}) {
    const [internalSelectedIndex, setInternalSelectedIndex] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const selectedIndex = controlledSelectedIndex ?? internalSelectedIndex;

    const handleStepSelect = (index) => {
        if (controlledSelectedIndex == null) {
            setInternalSelectedIndex(index);
        }
        if (onSelect) onSelect(index);
    };

    return (
        // Συμμετρικά paddings και μικρότερο πάνω κενό
        <div style={{ padding: "4px 0 0", boxSizing: "border-box" }}>
            {/* Header με ίσο χώρο αριστερά/δεξιά */}
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    padding: "0 10px 6px",
                    borderBottom: "1px solid rgb(183, 186, 188)",
                    boxSizing: "border-box",
                }}
            >
                <div style={{ flex: 1 }}>
                    <label className="active-label">Steps:</label>
                </div>
                <div style={{ flex: 1 }}>
                    <label className="active-label">Category:</label>
                </div>
            </div>

            {/* Περιεχόμενο σε δύο στήλες με ίσο “αέρα” */}
            <div style={{ display: "flex", gap: 12, padding: "8px 10px 0", boxSizing: "border-box" }}>
                <div style={{ flex: 1 }}>
                    <Steps
                        steps={interviewsteps}
                        selectedIndex={selectedIndex}
                        hoveredIndex={hoveredIndex}
                        onSelect={handleStepSelect}
                        onHover={setHoveredIndex}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <Steps
                        steps={category}
                        selectedIndex={selectedIndex}
                        hoveredIndex={hoveredIndex}
                        onSelect={handleStepSelect}
                        onHover={setHoveredIndex}
                    />
                </div>
            </div>
        </div>
    );
}

export default InterviewSteps;
