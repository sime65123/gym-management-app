"use client"

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function TicketPage() {
  const searchParams = useSearchParams();
  const ticketUrl = searchParams.get('url');
  const [ticketData, setTicketData] = useState<any>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketUrl) return;
      
      try {
        const response = await fetch(ticketUrl);
        if (!response.ok) throw new Error('Ticket non trouvé');
        const data = await response.json();
        setTicketData(data);
      } catch (error) {
        console.error('Erreur lors du chargement du ticket:', error);
      }
    };

    fetchTicket();
  }, [ticketUrl]);

  const handlePrint = () => {
    window.print();
  };

  if (!ticketData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement du ticket...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg my-8 print:shadow-none print:p-0">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold">Ticket de séance</h1>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>
      
      <div className="border rounded-lg p-6 print:border-0 print:p-0">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">GYM TYPHON FORCE</h2>
          <p className="text-sm text-gray-600">Reçu de paiement de séance</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-medium">{ticketData.client_prenom} {ticketData.client_nom}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">
              {new Date(ticketData.date_jour).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Durée</p>
            <p className="font-medium">{ticketData.nombre_heures} heure{ticketData.nombre_heures > 1 ? 's' : ''}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Montant payé</p>
            <p className="font-bold text-lg">{ticketData.montant_paye.toLocaleString()} FCFA</p>
          </div>
        </div>
        
        <div className="border-t pt-4 mt-6 text-center text-sm text-gray-500">
          <p>Merci pour votre confiance !</p>
          <p className="mt-2">Gym Typhon Force - Tél: XX XX XX XX XX</p>
        </div>
      </div>
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-print, #ticket-print * {
            visibility: visible;
          }
          #ticket-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
