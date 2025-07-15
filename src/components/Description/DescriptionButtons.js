import { Col, Row, Button } from 'reactstrap';


function DescriptionButtons() {
    return (<Row className="mt-3" style={{ paddingTop: '20px', display: 'flex', gap: '10px' }}>
        <Col md="2" className="text-center">
            <Button color="secondary">Update</Button>
        </Col>
        <Col md="6" className="text-center">
            <Button color="secondary" style={{ marginLeft: '12px' }}>Publish Job Ad</Button>
        </Col>
        <Col md="4" className="text-center" style={{ marginLeft: '-30px' }}>
            <Button color="danger" style={{ marginRight: '-30px' }}>Delete Job Ad</Button>
        </Col>
    </Row>)
}

export default DescriptionButtons;