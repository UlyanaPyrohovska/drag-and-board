import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Users, Star, ArrowLeft, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BoardSettingsModal } from './BoardSettingsModal';
import { ShareBoardModal } from './ShareBoardModal';

interface NavbarProps {
  title: string;
  board?: any;
  onBoardUpdated?: (board: any) => void;
}

export function Navbar({ title, board, onBoardUpdated }: NavbarProps) {
  const [isStarred, setIsStarred] = useState(board?.is_favorite || false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleToggleStar = async () => {
    if (!board) return;

    try {
      const newFavoriteStatus = !isStarred;
      const { error } = await supabase
        .from('boards')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', board.id);

      if (error) throw error;

      setIsStarred(newFavoriteStatus);
      toast({
        title: newFavoriteStatus ? 'Board starred!' : 'Board unstarred',
        description: newFavoriteStatus ? 'Board added to favorites' : 'Board removed from favorites',
      });

      if (onBoardUpdated) {
        onBoardUpdated({ ...board, is_favorite: newFavoriteStatus });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update board',
        variant: 'destructive',
      });
    }
  };

  const handleBoardDeleted = () => {
    navigate('/');
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {board && (
            <Button variant="ghost" size="sm" onClick={handleToggleStar}>
              <Star className={`h-4 w-4 mr-2 ${isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              {isStarred ? 'Starred' : 'Star'}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {board && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowShare(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {board && (
        <>
          <BoardSettingsModal
            open={showSettings}
            onOpenChange={setShowSettings}
            board={board}
            onBoardUpdated={onBoardUpdated || (() => {})}
            onBoardDeleted={handleBoardDeleted}
          />
          <ShareBoardModal
            open={showShare}
            onOpenChange={setShowShare}
            board={board}
          />
        </>
      )}
    </header>
  );
}