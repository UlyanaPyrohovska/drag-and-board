import React, { useState } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Board } from '@/types/kanban';
import { sampleBoard } from '@/data/sampleBoard';

const Index = () => {
  const [board, setBoard] = useState<Board>(sampleBoard);

  const handleUpdateBoard = (updatedBoard: Board) => {
    setBoard(updatedBoard);
    // In a real app, you would save this to a backend
    console.log('Board updated:', updatedBoard);
  };

  return (
    <div className="h-screen overflow-hidden">
      <KanbanBoard board={board} onUpdateBoard={handleUpdateBoard} />
    </div>
  );
};

export default Index;
