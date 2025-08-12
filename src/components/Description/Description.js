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
                        <div className="boxStyle" style={{
                            minHeight: '370px',
                            overflow: 'hidden',
                            padding: '10px'
                        }}>
                            <textarea
                                className="desc-label"
                                value={description}
                                placeholder="Προσθέστε περιγραφή..."
                                onChange={(e) => onDescriptionChange?.(e.target.value)}
                                style={{ width: '100%', minHeight: '350px', resize: 'none' }}
                            />
                        </div>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}

export default JobDescription;
