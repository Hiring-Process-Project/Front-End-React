import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./questions.css";

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
                      {...dragProvided.draggableProps}
                      onClick={() => onSelectQuestion?.(q.id)}
                      title={q.name}
                      className={[
                        "q-draggable",
                        isSelected ? "is-selected" : "",
                        snapshot.isDragging ? "is-dragging" : ""
                      ].join(" ").trim()}
                      style={dragProvided.draggableProps.style}
                    >
                      <div className="q-draggable-row">
                        <span
                          {...dragProvided.dragHandleProps}
                          className="q-drag-handle"
                          title="Drag to reorder"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⠿
                        </span>

                        <span className="q-question-text">{q.name}</span>
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}

            {provided.placeholder}

            {(!questions || questions.length === 0) && (
              <div className="q-empty">No questions</div>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
