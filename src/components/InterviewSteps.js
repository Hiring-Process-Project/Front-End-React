import { Col, Row } from "reactstrap";
import Steps from "./Steps";
import { useState } from "react";

function InterviewSteps({ interviewsteps, category }) {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const handleStepSelect = (index) => {
        setSelectedIndex(index);
    };

    return (
        <Row className="g-4">
            <Row style={{ borderBottom: "1px solid rgb(183, 186, 188)" }}>
                <Col md='6'><label className="active-label">Steps:</label></Col>
                <Col md='6'><label className="active-label">Category:</label></Col>
            </Row>
            <Row>
                <Col md='6'>
                    <Steps
                        steps={interviewsteps}
                        selectedIndex={selectedIndex}
                        hoveredIndex={hoveredIndex}
                        onSelect={handleStepSelect}
                        onHover={setHoveredIndex}
                    />
                </Col>
                <Col md='6'>
                    <Steps
                        steps={category}
                        selectedIndex={selectedIndex}
                        hoveredIndex={hoveredIndex}
                        onSelect={handleStepSelect}
                        onHover={setHoveredIndex}
                    />
                </Col>
            </Row>
        </Row>
    );
}

export default InterviewSteps;
