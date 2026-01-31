import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
    pointerWithin
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableLayerItem } from './DraggableLayerItem';
import { useEditorStore, LayerState } from '@/store/editor.store';
import { createPortal } from 'react-dom';

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

export function DraggableLayerList() {
    const {
        layers,
        triggerSetActiveLayer,
        triggerToggleLayerVisibility,
        triggerReparentLayer,
        triggerRenameLayer
    } = useEditorStore();

    const [activeId, setActiveId] = React.useState<string | null>(null);
    const [overId, setOverId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags when clicking
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
        setOverId(null);
    }

    function handleDragOver(event: DragOverEvent) {
        const { over } = event;
        setOverId(over ? (over.id as string) : null);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);
        setOverId(null);

        if (!over) return;
        if (active.id === over.id) return;

        triggerReparentLayer(active.id as string, over.id as string);
    }

    const activeLayer = layers.find(l => l.id === activeId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={layers.map(l => l.id)}
                strategy={() => null} // DISABLE Sorting Animation
            >
                <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                    {layers.map((layer) => (
                        <DraggableLayerItem
                            key={layer.id}
                            id={layer.id}
                            name={layer.name}
                            active={layer.active}
                            visible={layer.visible}
                            parentId={layer.parentId}
                            depth={layer.depth}
                            isOverTarget={layer.id === overId && layer.id !== activeId}
                            onClick={() => triggerSetActiveLayer(layer.id)}
                            onToggleVisibility={(e) => { e.stopPropagation(); triggerToggleLayerVisibility(layer.id); }}
                            onRename={(newName) => triggerRenameLayer(layer.id, newName)}
                        />
                    ))}
                </div>
            </SortableContext>

            {createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeLayer ? (
                        <div className="h-8 flex items-center px-4 bg-[#007acc] text-white opacity-90 border border-white rounded shadow-xl">
                            <span className="truncate">{activeLayer.name}</span>
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
