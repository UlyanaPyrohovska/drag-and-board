import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Board } from '@/types/kanban';

const BoardPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchBoard();
  }, [id]);

  const fetchBoard = async () => {
    try {
      // Fetch board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .single();

      if (boardError) throw boardError;

      // Fetch lists with cards
      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select(`
          *,
          cards (*)
        `)
        .eq('board_id', id)
        .order('position');

      if (listsError) throw listsError;

      // Transform data to match our types
      const transformedBoard: Board = {
        id: boardData.id,
        title: boardData.title,
        columns: (listsData || []).map(list => ({
          id: list.id,
          title: list.title,
          order: list.position,
          cards: (list.cards || []).map(card => ({
            id: card.id,
            title: card.title,
            description: card.description || '',
            dueDate: card.due_date || '',
            assignees: [], // We'll implement assignees later
            columnId: card.list_id,
            order: card.position,
            createdAt: card.created_at,
          })).sort((a, b) => a.order - b.order)
        })).sort((a, b) => a.order - b.order)
      };

      setBoard(transformedBoard);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load board',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBoard = async (updatedBoard: Board) => {
    setBoard(updatedBoard);
    
    // Sync with database
    try {
      // Update lists and cards positions
      for (const column of updatedBoard.columns) {
        await supabase
          .from('lists')
          .update({ position: column.order })
          .eq('id', column.id);

        for (const card of column.cards) {
          await supabase
            .from('cards')
            .update({ 
              position: card.order,
              list_id: card.columnId
            })
            .eq('id', card.id);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading board...</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Board not found</h2>
          <p className="text-muted-foreground mb-4">The board you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: board ? `${board.columns[0]?.color || '#0079bf'}10` : undefined }}>
      <KanbanBoard board={board} onUpdateBoard={handleUpdateBoard} />
    </div>
  );
};

export default BoardPage;