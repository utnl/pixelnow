import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableLayerItemProps {
    id: string;
    name: string;
    active: boolean;
    visible: boolean;
    parentId?: string | null;
    depth?: number;
    isOverTarget?: boolean;
    onClick: () => void;
    onToggleVisibility: (e: React.MouseEvent) => void;
    onRename: (newName: string) => void;
}

export function DraggableLayerItem({
    id,
    name,
    active,
    visible,
    parentId,
    depth = 0,
    isOverTarget = false,
    onClick,
    onToggleVisibility,
    onRename
}: DraggableLayerItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const [isEditing, setIsEditing] = React.useState(false);
    const [editedName, setEditedName] = React.useState(name);

    // Sync name if changed externally
    React.useEffect(() => {
        if (!isEditing) setEditedName(name);
    }, [name, isEditing]);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        paddingLeft: `${(depth * 16) + 8}px`,
        zIndex: isOverTarget ? 10 : 'auto', // Ensure highlight is on top
    };

    const handleSave = () => {
        if (editedName.trim() && editedName !== name) {
            onRename(editedName.trim());
        } else {
            setEditedName(name); // Revert if empty
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setEditedName(name);
            setIsEditing(false);
        }
        e.stopPropagation(); // Prevent dnd keyboard shortcuts
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`h-8 flex items-center pr-2 text-xs border-b border-black cursor-pointer select-none group transition-all 
                ${isOverTarget ? 'ring-2 ring-yellow-400 bg-[#505050] scale-[1.02]' : ''}
                ${active
                    ? 'bg-[#007acc] text-white border-l-4 border-l-white font-medium'
                    : 'hover:bg-[#4a4a4a] text-gray-400 border-l-4 border-l-transparent'
                }`}
            onClick={(e) => {
                if (!isDragging) onClick();
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
        >
            <button
                className={`mr-2 w-4 h-4 flex items-center justify-center rounded hover:bg-black/20 ${visible ? 'text-inherit opacity-100' : 'text-gray-500 opacity-50'}`}
                onClick={onToggleVisibility}
                // Prevent drag when clicking visibility toggle
                onPointerDown={(e) => e.stopPropagation()}
                title={visible ? "Hide Layer" : "Show Layer"}
            >
                {visible ? '👁️' : '🚫'}
            </button>

            {isEditing ? (
                <input
                    className="flex-1 bg-[#202020] text-white border border-blue-500 px-1 rounded outline-none h-6"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    onPointerDown={(e) => e.stopPropagation()} // Stop drag start
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span className="flex-1 truncate pointer-events-none">{name}</span>
            )}
        </div>
    );
}
