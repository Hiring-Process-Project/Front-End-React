import { useState } from "react";
import { Row, Col } from "reactstrap";
import SidebarCard from "../components/SidebarCard";
import Candidates from "../components/Candidates/Candidates";

export default function HireFlowPage() {
    const [selectedJobAdId, setSelectedJobAdId] = useState(null);

    return (
        <Row>
            <SidebarCard
                onJobAdSelect={setSelectedJobAdId}
                selectedJobAdId={selectedJobAdId}
                baseUrl={process.env.REACT_APP_BASE_URL} //TOCHECK
            />
            <Col md="8">
                <Candidates jobAdId={selectedJobAdId} />
            </Col>
        </Row>
    );
}
