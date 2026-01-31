"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from "@/hooks/useTheme";
import TaskCard from "./TaskCard";
import { Circle, Clock, CheckCircle2 } from "lucide-react";

const columnConfig = {
  todo: { 
    title: "À faire",
    icon: Circle,
    // Bleu vif et visible
    lightColor: "from-blue-500 to-blue-600",
    darkColor: "from-blue-600 to-blue-700",
    lightBg: "from-blue-50/80 via-blue-100/40 to-white",
    darkBg: "from-blue-950 via-blue-900/80 to-blue-950/60",
    lightBorder: "border-blue-300/60",
    darkBorder: "border-blue-700/40",
    lightText: "text-blue-700",
    darkText: "text-blue-300",
    lightBadge: "bg-blue-100 text-blue-700 ring-1 ring-blue-300",
    darkBadge: "bg-blue-900/60 text-blue-300 ring-1 ring-blue-700/50",
    glowLight: "shadow-blue-500/10",
    glowDark: "shadow-blue-500/20",
  },
  inProgress: { 
    title: "En cours",
    icon: Clock,
    // Orange/Ambre vif
    lightColor: "from-orange-500 to-amber-600",
    darkColor: "from-orange-600 to-amber-700",
    lightBg: "from-orange-50/80 via-amber-100/40 to-white",
    darkBg: "from-blue-950 via-amber-900/20 to-blue-950/60",
    lightBorder: "border-orange-300/60",
    darkBorder: "border-amber-700/40",
    lightText: "text-orange-700",
    darkText: "text-amber-300",
    lightBadge: "bg-orange-100 text-orange-700 ring-1 ring-orange-300",
    darkBadge: "bg-amber-900/40 text-amber-300 ring-1 ring-amber-700/50",
    glowLight: "shadow-orange-500/10",
    glowDark: "shadow-orange-500/20",
  },
  done: { 
    title: "Terminées",
    icon: CheckCircle2,
    // Vert émeraude vif
    lightColor: "from-emerald-500 to-teal-600",
    darkColor: "from-emerald-600 to-teal-700",
    lightBg: "from-emerald-50/80 via-teal-100/40 to-white",
    darkBg: "from-blue-950 via-emerald-900/20 to-blue-950/60",
    lightBorder: "border-emerald-300/60",
    darkBorder: "border-emerald-700/40",
    lightText: "text-emerald-700",
    darkText: "text-emerald-300",
    lightBadge: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300",
    darkBadge: "bg-emerald-900/40 text-emerald-300 ring-1 ring-emerald-700/50",
    glowLight: "shadow-emerald-500/10",
    glowDark: "shadow-emerald-500/20",
  },
};

export default function TaskColumn({ id, title, tasks, onTaskClick }) {
  const { isDark } = useTheme();
  const config = columnConfig[id];
  const Icon = config.icon;

  return (
    <div
      className={`
        flex flex-col h-full rounded-2xl transition-all duration-300
        border-2 backdrop-blur-sm shadow-xl relative z-0
        ${isDark 
          ? `bg-gradient-to-b ${config.darkBg} ${config.darkBorder} ${config.glowDark}` 
          : `bg-gradient-to-b ${config.lightBg} ${config.lightBorder} ${config.glowLight}`
        }
      `}
    >
      {/* Header avec couleur vive */}
      <div className={`
        p-4 rounded-t-2xl shrink-0
        bg-gradient-to-r ${isDark ? config.darkColor : config.lightColor}
        backdrop-blur-sm
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-9 h-9 rounded-xl flex items-center justify-center
              ${isDark ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/40 backdrop-blur-sm'}
              ring-2 ring-white/30
            `}>
              <Icon size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-wide text-white drop-shadow-sm">
              {title}
            </h3>
          </div>
          <span className={`
            px-3 py-1.5 rounded-xl text-xs font-black
            ${isDark ? 'bg-white/20 text-white' : 'bg-white/50 text-white'}
            backdrop-blur-sm ring-1 ring-white/30 shadow-lg
          `}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Zone Drop avec scrollbar personnalisée */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 overflow-y-auto px-3 py-4 space-y-3
              transition-all duration-300 rounded-b-2xl
              scrollbar-thin scrollbar-track-transparent
              ${isDark ? 'scrollbar-thumb-blue-700/50 hover:scrollbar-thumb-blue-600/70' : 'scrollbar-thumb-blue-400/50 hover:scrollbar-thumb-blue-500/70'}
              ${snapshot.isDraggingOver 
                ? isDark 
                  ? 'bg-blue-800/30 ring-2 ring-blue-500/30 ring-inset' 
                  : 'bg-blue-200/40 ring-2 ring-blue-400/40 ring-inset'
                : ''
              }
            `}
          >
            {tasks.map((task, index) => (
              <Draggable key={task._id} draggableId={task._id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{ 
                      ...provided.draggableProps.style,
                      // Fix pour le z-index pendant le drag
                      ...(snapshot.isDragging && {
                        zIndex: 9999,
                      })
                    }}
                    className={snapshot.isDragging ? 'z-[9999]' : ''}
                  >
                    <TaskCard
                      task={task}
                      onClick={() => onTaskClick(task)}
                      isDragging={snapshot.isDragging}
                      columnColor={config}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {/* État vide avec style adapté */}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className={`
                h-40 border-2 border-dashed rounded-2xl
                flex flex-col items-center justify-center gap-3
                transition-all duration-300
                ${isDark
                  ? `${config.darkBorder} bg-blue-950/20`
                  : `${config.lightBorder} bg-white/40`
                }
              `}>
                <Icon 
                  size={32} 
                  className={isDark ? config.darkText : config.lightText} 
                  strokeWidth={1.5}
                />
                <p className={`
                  text-sm font-bold
                  ${isDark ? config.darkText : config.lightText}
                `}>
                  Aucune tâche
                </p>
              </div>
            )}
            
            {/* Message de drop - uniquement si la colonne est vide OU en train de hover */}
            {snapshot.isDraggingOver && (
              <div className={`
                h-32 border-2 border-dashed rounded-2xl
                flex items-center justify-center
                animate-pulse transition-all duration-200
                ${isDark
                  ? 'border-blue-500 bg-blue-900/30'
                  : 'border-blue-500 bg-blue-100/60'
                }
              `}>
                <p className={`
                  text-sm font-black uppercase tracking-wider
                  ${isDark ? 'text-blue-300' : 'text-blue-700'}
                `}>
                  Déposer ici
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}