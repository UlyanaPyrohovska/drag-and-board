import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Star, Users, Settings, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CreateBoardDialog } from '@/components/boards/CreateBoardDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Board {
  id: string;
  title: string;
  description?: string;
  background_color: string;
  is_favorite: boolean;
  created_at: string;
  user_id: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoards(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch boards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (boardId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('boards')
        .update({ is_favorite: !isFavorite })
        .eq('id', boardId);

      if (error) throw error;

      setBoards(boards.map(board => 
        board.id === boardId 
          ? { ...board, is_favorite: !isFavorite }
          : board
      ));

      toast({
        title: !isFavorite ? 'Board starred!' : 'Board unstarred',
        description: !isFavorite ? 'Board added to favorites' : 'Board removed from favorites',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update board',
        variant: 'destructive',
      });
    }
  };

  const deleteBoard = async (boardId: string) => {
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId);

      if (error) throw error;

      setBoards(boards.filter(board => board.id !== boardId));
      toast({
        title: 'Board deleted',
        description: 'Board has been permanently deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete board',
        variant: 'destructive',
      });
    }
  };

  const favoriteBoards = boards.filter(board => board.is_favorite);
  const regularBoards = boards.filter(board => !board.is_favorite);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your boards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">TrelloBoard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.email}</span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Favorites Section */}
        {favoriteBoards.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold">Starred Boards</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favoriteBoards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteBoard}
                  onClick={() => navigate(`/board/${board.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Boards Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Boards</h2>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Board
            </Button>
          </div>
          
          {boards.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent className="pt-0">
                <div className="mb-4">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first board to start organizing your projects
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Board
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {regularBoards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteBoard}
                  onClick={() => navigate(`/board/${board.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <CreateBoardDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onBoardCreated={(newBoard) => {
          setBoards([newBoard, ...boards]);
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
};

interface BoardCardProps {
  board: Board;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}

const BoardCard = ({ board, onToggleFavorite, onDelete, onClick }: BoardCardProps) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow group relative"
      style={{ backgroundColor: board.background_color + '20' }}
    >
      <CardHeader 
        className="pb-2"
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{board.title}</CardTitle>
            {board.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {board.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onToggleFavorite(board.id, board.is_favorite)}>
                <Star className={`h-4 w-4 mr-2 ${board.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                {board.is_favorite ? 'Unstar' : 'Star'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(board.id)}
                className="text-destructive"
              >
                Delete Board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent onClick={onClick} className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {board.is_favorite && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                Starred
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(board.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;