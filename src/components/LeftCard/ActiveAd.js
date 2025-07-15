import { Col, Row } from 'reactstrap';
import '../../index.css'
import OccupationDropdown from './OccupationDropDown';


export default function ActiveAd({ activeads }) {
    return (
        <Col xs="3" className="boxStyle" style={{
            height: '350px',
            paddingLeft: '0.5rem', paddingRight: '0.5rem', overflow: 'hidden'
        }}>
            <Row style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #B7BABC', paddingTop: '7px', paddingBottom: '9px' }}>
                <label className="active-label">ActiveAd:</label>

            </Row>
            <OccupationDropdown occupations={activeads} />
        </Col>

    );
}