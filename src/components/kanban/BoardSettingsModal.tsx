import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserPlus, Crown, Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BoardSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: any;
  onBoardUpdated: (board: any) => void;
  onBoardDeleted: () => void;
}

const backgroundColors = [
  '#0079bf', '#d29034', '#519839', '#b04632', '#89609e',
  '#cd5a91', '#4bbf6b', '#00aecc', '#838c91'
];

export const BoardSettingsModal = ({ 
  open, 
  onOpenChange, 
  board, 
  onBoardUpdated, 
  onBoardDeleted 
}: BoardSettingsModalProps) => {
  const [title, setTitle] = useState(board?.title || '');
  const [description, setDescription] = useState(board?.description || '');
  const [selectedColor, setSelectedColor] = useState(board?.background_color || backgroundColors[0]);
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (open && board) {
      setTitle(board.title);
      setDescription(board.description || '');
      setSelectedColor(board.background_color);
      fetchMembers();
    }
  }, [open, board]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('board_members')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('board_id', board.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Board title is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('boards')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          background_color: selectedColor,
        })
        .eq('id', board.id)
        .select()
        .single();

      if (error) throw error;

      onBoardUpdated(data);
      toast({
        title: 'Settings saved',
        description: 'Board settings have been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update board settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) return;

    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('display_name', memberEmail.trim())
        .single();

      if (userError) {
        toast({
          title: 'Error',
          description: 'User not found',
          variant: 'destructive',
        });
        return;
      }

      // Add as board member
      const { error } = await supabase
        .from('board_members')
        .insert({
          board_id: board.id,
          user_id: userData.id,
          role: 'member'
        });

      if (error) throw error;

      setMemberEmail('');
      fetchMembers();
      toast({
        title: 'Member added',
        description: 'New member has been added to the board.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to add member',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('board_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      fetchMembers();
      toast({
        title: 'Member removed',
        description: 'Member has been removed from the board.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBoard = async () => {
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', board.id);

      if (error) throw error;

      onBoardDeleted();
      onOpenChange(false);
      toast({
        title: 'Board deleted',
        description: 'Board has been permanently deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete board',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Board Settings</DialogTitle>
          <DialogDescription>
            Manage your board settings, members, and permissions.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="board-title">Board Title</Label>
              <Input
                id="board-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter board title..."
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="board-description">Description</Label>
              <Textarea
                id="board-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your board..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex flex-wrap gap-2">
                {backgroundColors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-md border-2 transition-all ${
                      selectedColor === color ? 'border-primary scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
              Save Settings
            </Button>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter email or username..."
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
              />
              <Button onClick={handleAddMember}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {getRoleIcon(member.role)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.profiles?.display_name || 'Unknown User'}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="danger" className="space-y-4">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Delete Board</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This action cannot be undone. This will permanently delete the board and all its data.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Board
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the board
                        and remove all of its data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteBoard}>
                        Delete Board
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};