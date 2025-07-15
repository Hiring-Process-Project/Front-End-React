import { Col, Row } from 'reactstrap';

function JobDescription({ description }) {
    return (
        <Row>
            <Col>
                <Row className="mb-2" style={{ paddingLeft: '10px' }}>
                    <Col>
                        <label className="description-labels">{description}</label>
                    </Col>
                </Row>

                <Row >

                    <Col>
                        <div className="boxStyle" style={{
                            minHeight: '370px',
                            overflow: 'hidden',
                            padding: '10px'

                        }}>
                            <textarea className="desc-label" placeholder={description}></textarea>
                        </div>
                    </Col>

                </Row>
            </Col>
        </Row>
    );
}

export default JobDescription;
