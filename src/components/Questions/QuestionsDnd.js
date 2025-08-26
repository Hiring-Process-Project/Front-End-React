// QuestionsDnd.jsx
import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function QuestionsDnd({
  stepId,
  questions = [],
  selectedQuestionId,
  onSelectQuestion,
  onReorderInStep,
  onMoveToAnotherStep,
}) {
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result || {};
    if (!destination) return;

    if (destination.droppableId === source.droppableId) {
      const from = source.index;
      const to = destination.index;
      if (from === to) return;
      await onReorderInStep?.(stepId, from, to);
      return;
    }

    if (onMoveToAnotherStep) {
      const fromStep = parseInt(source.droppableId.replace("step-", ""), 10);
      const toStep = parseInt(destination.droppableId.replace("step-", ""), 10);
      const qId = parseInt(draggableId.replace("q-", ""), 10);
      await onMoveToAnotherStep(fromStep, toStep, qId, destination.index);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`step-${stepId}`}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {questions.map((q, idx) => {
              const isSelected = q.id === selectedQuestionId;
              return (
                <Draggable key={q.id} draggableId={`q-${q.id}`} index={idx}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}   // ⬅️ μόνο draggableProps στο root
                      onClick={() => onSelectQuestion?.(q.id)}
                      title={q.name}
                      style={{
                        background: isSelected ? "#eef4ff" : "#f9f9f9",
                        border: isSelected ? "1px solid #9db7ff" : "1px solid #eee",
                        borderRadius: 8,
                        padding: "8px 10px",
                        marginBottom: 6,
                        userSelect: "none",
                        ...dragProvided.draggableProps.style,
                      }}
                    >
                      {/* row layout: handle + text */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {/* ⠿ drag handle */}
                        <span
                          {...dragProvided.dragHandleProps}     // ⬅️ το χερούλι
                          title="Drag to reorder"
                          onClick={(e) => e.stopPropagation()}  // μην κάνει select
                          style={{
                            cursor: "grab",
                            fontSize: 14,
                            opacity: 0.7,
                            lineHeight: 1,
                            userSelect: "none",
                          }}
                        >
                          ⠿
                        </span>

                        <span
                          style={{
                            flex: 1,
                            cursor: "pointer",
                            color: "#2b2b2b",
                            fontSize: 14,
                          }}
                        >
                          {q.name}
                        </span>
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}

            {provided.placeholder}

            {(!questions || questions.length === 0) && (
              <div style={{ fontSize: 12, opacity: 0.6, paddingLeft: 4 }}>
                No questions
              </div>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
