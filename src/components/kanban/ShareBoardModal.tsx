import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Link2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ShareBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: any;
}

export const ShareBoardModal = ({ open, onOpenChange, board }: ShareBoardModalProps) => {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/board/${board?.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copied!',
      description: 'Board link has been copied to clipboard.',
    });
  };

  const handleEmailInvite = () => {
    const subject = `You've been invited to collaborate on "${board?.title}"`;
    const body = `Hi,\n\nYou've been invited to collaborate on the board "${board?.title}".\n\nClick here to join: ${shareUrl}\n\nBest regards`;
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    
    toast({
      title: 'Email client opened',
      description: 'Your default email client should open with the invitation.',
    });
    
    setEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Share Board
          </DialogTitle>
          <DialogDescription>
            Share this board with others by sending them a link or email invitation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Link */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Share Link</CardTitle>
              <CardDescription className="text-xs">
                Anyone with this link can view the board
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="text-xs"
                />
                <Button size="sm" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Invitation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Email Invitation</CardTitle>
              <CardDescription className="text-xs">
                Send a personalized invitation via email
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email" className="text-xs">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <Button 
                  onClick={handleEmailInvite} 
                  disabled={!email.trim()}
                  className="w-full"
                  size="sm"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                const shareData = {
                  title: board?.title,
                  text: `Check out this board: ${board?.title}`,
                  url: shareUrl,
                };
                
                if (navigator.share) {
                  navigator.share(shareData);
                } else {
                  handleCopyLink();
                }
              }}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};