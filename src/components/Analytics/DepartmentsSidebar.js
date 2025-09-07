import './Analytics.css';

export default function DepartmentsSidebar({
    departments = [],
    selectedDepartmentId = null,
    onSelectDepartment,
    onClearOrganization
}) {
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="sidebar-header-title">Departments</div>
                <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={onClearOrganization}
                    title="Back to Organization overview"
                >
                    All Org
                </button>
            </div>

            <div className="sidebar-stack">
                {departments.map((d) => {
                    const active = selectedDepartmentId === d.id;
                    return (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => onSelectDepartment({ id: d.id, name: d.name })}
                            className={`btn ${active ? 'btn-outline-secondary' : 'btn-light'} text-start sidebar-btn`}
                        >
                            {d.name}
                        </button>
                    );
                })}
                {!departments.length && (
                    <div className="text-muted fs-12">
                        No departments to show.
                    </div>
                )}
            </div>
        </div>
    );
}
