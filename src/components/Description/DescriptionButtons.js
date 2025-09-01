import { Col, Row, Button } from 'reactstrap';
import './description.css';

function DescriptionButtons({ onUpdate, onPublish, onDelete, saving }) {
    return (
        <Row className="mt-3 desc-buttons-row">
            <Col xs="12" sm="4" className="desc-btn-col">
                <Button color="secondary" onClick={onUpdate} disabled={saving} className="desc-btn-full">
                    {saving ? 'Saving…' : 'Update'}
                </Button>
            </Col>
            <Col xs="12" sm="4" className="desc-btn-col">
                <Button color="secondary" onClick={onPublish} disabled={saving} className="desc-btn-full">
                    Publish Job Ad
                </Button>
            </Col>
            <Col xs="12" sm="4" className="desc-btn-col">
                <Button color="danger" onClick={onDelete} disabled={saving} className="desc-btn-full">
                    Delete Job Ad
                </Button>
            </Col>
        </Row>
    );
}
export default DescriptionButtons;
