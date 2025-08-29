import { Col, Row } from 'reactstrap';

function JobDescription({
    name,
    description,
    onDescriptionChange,
    readOnly = false,   // 🔹 νέο prop
    disabled = false,   // προαιρετικά: αν θες και disabled state
}) {
    const isLocked = readOnly || disabled;

    return (
        <Row>
            <Col>
                <Row className="mb-2" style={{ paddingLeft: '10px' }}>
                    <Col>
                        <label className="description-labels">{name}</label>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <div
                            className="boxStyle"
                            style={{
                                minHeight: '370px',
                                overflow: 'hidden',
                                padding: '10px',
                                opacity: isLocked ? 0.85 : 1,
                            }}
                        >
                            {/* ΕΣΩΤΕΡΙΚΟ λευκό πλαίσιο */}
                            <div
                                style={{
                                    backgroundColor: isLocked ? '#f9f9f9' : 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '10px',
                                    minHeight: '100%',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                }}
                            >
                                <textarea
                                    className="desc-label"
                                    value={description}
                                    placeholder="Προσθέστε περιγραφή..."
                                    onChange={(e) => {
                                        if (!isLocked) onDescriptionChange?.(e.target.value);
                                    }}
                                    readOnly={isLocked}        // 🔹 δεν επιτρέπει edit
                                    disabled={disabled}         // 🔹 προαιρετικό disabled
                                    style={{
                                        width: '100%',
                                        minHeight: '330px',
                                        resize: 'none',
                                        border: 'none',
                                        outline: 'none',
                                        backgroundColor: 'transparent',
                                        color: disabled ? '#6b7280' : 'inherit',
                                        cursor: isLocked ? 'not-allowed' : 'text',
                                    }}
                                />
                            </div>
                        </div>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}

export default JobDescription;
