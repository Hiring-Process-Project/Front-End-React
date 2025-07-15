import { Col, Row } from "reactstrap";
import Steps from "./Steps";

function InterviewSteps({ interviewsteps, category }) {
    return (
        <Row>
            <Row style={{
                display: 'flex', borderBottom: '1px solid #B7BABC'
            }}>
                <Col md='6'>
                    <label className="active-label" >Steps:</label>
                </Col>
                <Col md='6'>
                    <label className="active-label" >Category:</label>
                </Col>
            </Row>
            <Row>
                <Col md='6'>
                    <Steps steps={interviewsteps} />
                </Col>
                <Col md='6'>
                    <Steps steps={category} />
                </Col>
            </Row>
        </Row>
    )
}

export default InterviewSteps;