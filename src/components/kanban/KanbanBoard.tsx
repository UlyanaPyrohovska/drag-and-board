import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Board, Card, Column } from '@/types/kanban';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { CardModal } from './CardModal';
import { Navbar } from './Navbar';

interface KanbanBoardProps {
  board: Board;
  onUpdateBoard: (board: Board) => void;
}

export function KanbanBoard({ board, onUpdateBoard }: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    if (active.data.current?.type === 'card') {
      const card = active.data.current.card as Card;
      setActiveCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const isActiveCard = active.data.current?.type === 'card';
    const isOverCard = over.data.current?.type === 'card';
    const isOverColumn = over.data.current?.type === 'column';
    
    if (!isActiveCard) return;
    
    // Drop card over another card
    if (isActiveCard && isOverCard) {
      const activeCard = active.data.current.card as Card;
      const overCard = over.data.current.card as Card;
      
      if (activeCard.columnId !== overCard.columnId) {
        // Move to different column
        const newBoard = { ...board };
        const sourceColumn = newBoard.columns.find(col => col.id === activeCard.columnId);
        const targetColumn = newBoard.columns.find(col => col.id === overCard.columnId);
        
        if (sourceColumn && targetColumn) {
          sourceColumn.cards = sourceColumn.cards.filter(c => c.id !== activeCard.id);
          const overCardIndex = targetColumn.cards.findIndex(c => c.id === overCard.id);
          targetColumn.cards.splice(overCardIndex + 1, 0, { ...activeCard, columnId: overCard.columnId });
          onUpdateBoard(newBoard);
        }
      }
    }
    
    // Drop card over column
    if (isActiveCard && isOverColumn) {
      const activeCard = active.data.current.card as Card;
      const overColumn = over.data.current.column as Column;
      
      if (activeCard.columnId !== overColumn.id) {
        const newBoard = { ...board };
        const sourceColumn = newBoard.columns.find(col => col.id === activeCard.columnId);
        const targetColumn = newBoard.columns.find(col => col.id === overColumn.id);
        
        if (sourceColumn && targetColumn) {
          sourceColumn.cards = sourceColumn.cards.filter(c => c.id !== activeCard.id);
          targetColumn.cards.push({ ...activeCard, columnId: overColumn.id });
          onUpdateBoard(newBoard);
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const isActiveCard = active.data.current?.type === 'card';
    
    if (isActiveCard) {
      const activeCard = active.data.current.card as Card;
      const newBoard = { ...board };
      const column = newBoard.columns.find(col => col.id === activeCard.columnId);
      
      if (column) {
        const oldIndex = column.cards.findIndex(c => c.id === activeId);
        const newIndex = column.cards.findIndex(c => c.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          column.cards = arrayMove(column.cards, oldIndex, newIndex);
          onUpdateBoard(newBoard);
        }
      }
    }
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleUpdateCard = async (updatedCard: Card) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('cards')
        .update({
          title: updatedCard.title,
          description: updatedCard.description,
          due_date: updatedCard.dueDate || null,
          position: updatedCard.order,
        })
        .eq('id', updatedCard.id);

      if (error) throw error;

      // Update local state
      const newBoard = { ...board };
      const column = newBoard.columns.find(col => col.id === updatedCard.columnId);
      
      if (column) {
        const cardIndex = column.cards.findIndex(c => c.id === updatedCard.id);
        if (cardIndex !== -1) {
          column.cards[cardIndex] = updatedCard;
          onUpdateBoard(newBoard);
        }
      }
      
      setIsModalOpen(false);
      setSelectedCard(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update card',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCard = async (cardId: string, columnId: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      // Remove from local state
      const newBoard = { ...board };
      const column = newBoard.columns.find(col => col.id === columnId);
      
      if (column) {
        column.cards = column.cards.filter(c => c.id !== cardId);
        onUpdateBoard(newBoard);
      }
      
      setIsModalOpen(false);
      setSelectedCard(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete card',
        variant: 'destructive',
      });
    }
  };

  const handleAddCard = async (columnId: string, title: string) => {
    try {
      // Create card in database first
      const { data: newCard, error } = await supabase
        .from('cards')
        .insert({
          title,
          list_id: columnId,
          position: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Transform database card to local card format
      const localCard: Card = {
        id: newCard.id,
        title: newCard.title,
        description: newCard.description || '',
        dueDate: newCard.due_date || '',
        assignees: [],
        columnId: newCard.list_id,
        order: newCard.position,
        createdAt: newCard.created_at,
      };

      // Add to local state
      const newBoard = { ...board };
      const column = newBoard.columns.find(col => col.id === columnId);
      
      if (column) {
        column.cards.push(localCard);
        onUpdateBoard(newBoard);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to create card',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar title={board.title} />
      
      <div className="flex-1 p-6 overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full overflow-x-auto pb-6">
            <SortableContext
              items={board.columns.map(col => col.id)}
              strategy={horizontalListSortingStrategy}
            >
              {board.columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onCardClick={handleCardClick}
                  onAddCard={handleAddCard}
                />
              ))}
            </SortableContext>
          </div>
          
          <DragOverlay>
            {activeCard && (
              <div className="drag-overlay">
                <KanbanCard card={activeCard} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
      
      {selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCard(null);
          }}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  );
}