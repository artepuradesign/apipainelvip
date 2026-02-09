
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { User } from "@/types/user";

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onUserChange: (user: User) => void;
}

const EditUserModal = ({ user, isOpen, onClose, onSave, onUserChange }: EditUserModalProps) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                value={user.name}
                onChange={(e) => onUserChange({ ...user, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                value={user.email}
                onChange={(e) => onUserChange({ ...user, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-balance">Saldo</Label>
              <Input
                id="edit-balance"
                type="number"
                value={user.balance}
                onChange={(e) => onUserChange({ ...user, balance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="edit-plan">Plano</Label>
              <Input
                id="edit-plan"
                value={user.plan}
                onChange={(e) => onUserChange({ ...user, plan: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-notes">Observações</Label>
            <Textarea
              id="edit-notes"
              value={user.notes || ''}
              onChange={(e) => onUserChange({ ...user, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onSave}>Salvar Alterações</Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
