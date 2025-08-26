import React from 'react';

export default function DepartmentsSidebar({
    departments = [],
    selectedDepartmentId = null,
    onSelectDepartment,
    onClearOrganization
}) {
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div style={{ fontWeight: 600 }}>Departments</div>
                <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={onClearOrganization}
                    title="Back to Organization overview"
                >
                    All Org
                </button>
            </div>

            <div className="d-flex flex-column" style={{ gap: 12 }}>
                {departments.map((d) => {
                    const active = selectedDepartmentId === d.id;
                    return (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => onSelectDepartment({ id: d.id, name: d.name })}
                            className={`btn ${active ? 'btn-outline-secondary' : 'btn-light'} text-start`}
                            style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}
                        >
                            {d.name}
                        </button>
                    );
                })}
                {!departments.length && (
                    <div className="text-muted" style={{ fontSize: 12 }}>
                        No departments to show.
                    </div>
                )}
            </div>
        </div>
    );
}
