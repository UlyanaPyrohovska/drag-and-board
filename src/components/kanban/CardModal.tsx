import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/types/kanban';
import { Trash2, Calendar, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface CardModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (card: Card) => void;
  onDelete: (cardId: string, columnId: string) => void;
}

export function CardModal({ card, isOpen, onClose, onUpdate, onDelete }: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [assigneeInput, setAssigneeInput] = useState('');

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description || '');
    setDueDate(card.dueDate || '');
  }, [card]);

  const handleSave = () => {
    const updatedCard: Card = {
      ...card,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || undefined,
    };
    onUpdate(updatedCard);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this card?')) {
      onDelete(card.id, card.columnId);
    }
  };

  const handleAddAssignee = () => {
    if (assigneeInput.trim() && !card.assignees.includes(assigneeInput.trim())) {
      const updatedCard: Card = {
        ...card,
        assignees: [...card.assignees, assigneeInput.trim()],
      };
      onUpdate(updatedCard);
      setAssigneeInput('');
    }
  };

  const handleRemoveAssignee = (assignee: string) => {
    const updatedCard: Card = {
      ...card,
      assignees: card.assignees.filter(a => a !== assignee),
    };
    onUpdate(updatedCard);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Card</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter card title..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter card description..."
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Created
              </Label>
              <div className="text-sm text-muted-foreground py-2">
                {format(new Date(card.createdAt), 'PPP')}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Assignees
            </Label>
            <div className="flex gap-2">
              <Input
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                placeholder="Enter name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAssignee();
                  }
                }}
              />
              <Button onClick={handleAddAssignee} size="sm">
                Add
              </Button>
            </div>
            {card.assignees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {card.assignees.map((assignee) => (
                  <div
                    key={assignee}
                    className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    <span>{assignee}</span>
                    <button
                      onClick={() => handleRemoveAssignee(assignee)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}