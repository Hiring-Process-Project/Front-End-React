// Description/SkillSelectorReadOnly.jsx
import React, {
    useState, useMemo, useRef, useLayoutEffect, useEffect, useCallback,
} from "react";
import { Badge, Input, Row, Col } from "reactstrap";
import "./description.css";
import "./SkillSelector.css";

/**
 * panelHeight: καθαρό ύψος ΜΟΝΟ για το panel (ήδη αφαιρεμένα κουμπιά+header)
 * label: (προαιρετικό) ετικέτα που έρχεται από τον γονέα. Αν λείπει, δεν δείχνουμε τίποτα.
 * searchPlaceholder: (προαιρετικό) placeholder για την αναζήτηση
 */
export default function SkillSelectorReadOnly({
    requiredskills = [],
    panelHeight,
    label,
    searchPlaceholder,
}) {
    const [searchText, setSearchText] = useState("");

    const filtered = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        return q
            ? requiredskills.filter((s) => (s || "").toLowerCase().includes(q))
            : requiredskills;
    }, [searchText, requiredskills]);

    const boxRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const [listH, setListH] = useState(240);

    const recalcInsideBox = useCallback(() => {
        const box = boxRef.current;
        const inp = inputRef.current;
        const list = listRef.current;
        if (!box || !inp || !list) return;

        const boxHeight =
            typeof panelHeight === "number" ? panelHeight : box.clientHeight;

        const csBox = getComputedStyle(box);
        const padTop = parseFloat(csBox.paddingTop || "0");
        const padBottom = parseFloat(csBox.paddingBottom || "0");
        const paddings = padTop + padBottom;

        const inputH = inp.offsetHeight || 38;
        const mt = parseFloat(getComputedStyle(list).marginTop || "0"); // .mt-3

        const inner = Math.max(100, boxHeight - paddings - inputH - mt);
        setListH((prev) => (Math.abs(prev - inner) > 1 ? inner : prev));
    }, [panelHeight]);

    const kickInside = useCallback(() => {
        recalcInsideBox();
        requestAnimationFrame(() => recalcInsideBox());
        setTimeout(recalcInsideBox, 0);
        setTimeout(recalcInsideBox, 120);
        if (document?.fonts?.ready) {
            document.fonts.ready.then(() => recalcInsideBox());
        }
    }, [recalcInsideBox]);

    useLayoutEffect(() => { kickInside(); }, [kickInside]);

    useEffect(() => {
        let raf = 0;
        const onResize = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(kickInside);
        };
        window.addEventListener("resize", onResize);
        const t = setTimeout(kickInside, 0);
        return () => {
            window.removeEventListener("resize", onResize);
            cancelAnimationFrame(raf);
            clearTimeout(t);
        };
    }, [kickInside, filtered.length, searchText, panelHeight]);

    // default placeholder: αν έχουμε label, χρησιμοποιούμε “Search within <label>…”
    const ph = searchPlaceholder ??
        (label ? `Search within ${label.toLowerCase()}...` : "Search...");

    return (
        <Row style={{ height: "100%", minHeight: 0 }}>
            <Col className="desc-col">
                {/* Ετικέτα μόνο αν δόθηκε από τον γονέα */}
                {label ? (
                    <Row className="mb-2 desc-label-row">
                        <Col><label className="description-labels">{label}</label></Col>
                    </Row>
                ) : null}

                <Row style={{ height: label ? "calc(100% - 28px)" : "100%", minHeight: 0 }}>
                    <Col className="desc-col">
                        <div
                            ref={boxRef}
                            className="boxStyle skills-box"
                            style={{
                                minHeight: 0,
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden",
                                padding: 10,
                            }}
                        >
                            <Input
                                innerRef={inputRef}
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder={ph}
                                style={{ flex: "0 0 38px", minHeight: 38 }}
                            />

                            <div
                                ref={listRef}
                                className="selected-skills-container mt-3 skills-scroll"
                                style={{
                                    height: `${Math.round(listH)}px`,
                                    minHeight: 0,
                                    overflowY: "auto",
                                    overflowX: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                {filtered.length ? (
                                    filtered.map((skill, i) => (
                                        <Badge key={i} color="info" pill className="skill-badge">
                                            <span className="skill-badge-text" title={skill}>
                                                {skill}
                                            </span>
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="description-labels">No skills match.</span>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}
