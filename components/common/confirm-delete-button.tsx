"use client"

import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogAction, AlertDialogCancel, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { ReactNode } from "react"

type ConfirmDeleteButtonProps = {
  onDelete: () => Promise<void>
  children: ReactNode // Le bouton ou l'icône à utiliser comme trigger
  confirmMessage?: string
  successMessage?: string
  errorMessage?: string
}

export function ConfirmDeleteButton({
  onDelete,
  children,
  confirmMessage = "Voulez-vous vraiment supprimer cet élément ?",
  successMessage = "Suppression réussie.",
  errorMessage = "La suppression a échoué.",
}: ConfirmDeleteButtonProps) {
  const { toast } = useToast()
  const handleDelete = async () => {
    try {
      await onDelete()
      toast({
        title: "Succès",
        description: successMessage,
        duration: 5000,
      })
    } catch (e) {
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    }
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Confirmation de suppression</AlertDialogTitle>
        <p>{confirmMessage}</p>
        <div className="flex justify-end gap-2 mt-4">
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
} 