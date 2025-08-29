import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/types/kanban';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface KanbanCardProps {
  card: Card;
  onClick: (card: Card) => void;
}

export function KanbanCard({ card, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
  const isDueSoon = card.dueDate && 
    new Date(card.dueDate) > new Date() &&
    new Date(card.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(card)}
      className={`kanban-card p-4 space-y-3 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <h4 className="font-medium text-card-foreground leading-tight">
        {card.title}
      </h4>
      
      {card.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {card.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {card.dueDate && (
            <Badge
              variant={isOverdue ? 'destructive' : isDueSoon ? 'default' : 'secondary'}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(card.dueDate), 'MMM d')}
            </Badge>
          )}
        </div>
        
        {card.assignees.length > 0 && (
          <div className="flex -space-x-2">
            {card.assignees.slice(0, 3).map((assignee, index) => (
              <Avatar key={index} className="h-6 w-6 border-2 border-card">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee}`} />
                <AvatarFallback className="text-xs">
                  {assignee.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {card.assignees.length > 3 && (
              <div className="h-6 w-6 bg-muted border-2 border-card rounded-full flex items-center justify-center text-xs text-muted-foreground">
                +{card.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {format(new Date(card.createdAt), 'MMM d')}
        </div>
      </div>
    </div>
  );
}