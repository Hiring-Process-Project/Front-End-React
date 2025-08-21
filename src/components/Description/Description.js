import { Col, Row } from 'reactstrap';

function JobDescription({ name, description, onDescriptionChange }) {
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
                                padding: '10px'
                            }}
                        >
                            {/* ΕΣΩΤΕΡΙΚΟ λευκό πλαίσιο */}
                            <div
                                style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '10px',
                                    minHeight: '100%',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                            >
                                <textarea
                                    className="desc-label"
                                    value={description}
                                    placeholder="Προσθέστε περιγραφή..."
                                    onChange={(e) => onDescriptionChange?.(e.target.value)}
                                    style={{
                                        width: '100%',
                                        minHeight: '330px',
                                        resize: 'none',
                                        border: 'none',
                                        outline: 'none',
                                        backgroundColor: 'transparent'
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
