import { Col, Row } from 'reactstrap';
import './description.css';

function Description({ name, description, onDescriptionChange, readOnly, disabled }) {
    return (
        <Row className="desc-root">
            <Col className="desc-col">
                <Row className="mb-2 desc-label-row">
                    <Col>
                        <label className="description-labels">{name}</label>
                    </Col>
                </Row>

                <Row className="desc-content-row">
                    <Col className="desc-content-col">
                        {/* ⬇️ Αφήνω το boxStyle ΚΑΙ ΤΟ ΕΣΩΤΕΡΙΚΟ ΤΟΥ ατόφιο όπως ζήτησες */}
                        <div
                            className="boxStyle"
                            style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                padding: 10,
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                    backgroundColor: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: 8,
                                    padding: 10,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    overflowY: 'auto', // ⬅ κάθετος scroll μέσα στο άσπρο
                                    overflowX: 'hidden',
                                    minHeight: 0,
                                }}
                            >
                                <textarea
                                    className="desc-label"
                                    value={description}
                                    placeholder="Add a description..."
                                    onChange={(e) => onDescriptionChange?.(e.target.value)}
                                    readOnly={!!readOnly}
                                    disabled={!!disabled}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        minHeight: 0,
                                        height: '100%',
                                        boxSizing: 'border-box',
                                        resize: 'none',
                                        border: 'none',
                                        outline: 'none',
                                        backgroundColor: 'transparent',
                                        overflowWrap: 'anywhere',
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

export default Description;
