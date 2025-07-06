import React from 'react';
import { Seance } from '@/types';

interface SeanceTicketProps {
  seance: Seance;
}

export const SeanceTicket: React.FC<SeanceTicketProps> = ({ seance }) => {
  return (
    <div style={{
      width: '80mm',
      padding: '15px',
      background: 'white',
      borderRadius: '8px',
      margin: '0 auto',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#333',
      boxSizing: 'border-box'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '2px solid #f0f0f0'
      }}>
        <img 
          src="/lg1.jpg" 
          alt="GYM PREMIUM" 
          style={{
            maxWidth: '100px',
            margin: '0 auto 10px',
            display: 'block'
          }} 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }} 
        />
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          margin: '10px 0 5px',
          color: '#1a365d'
        }}>
          GYM PREMIUM
        </div>
        <div style={{
          fontSize: '14px',
          color: '#4a5568',
          marginBottom: '15px'
        }}>
          Votre ticket de séance
        </div>
      </div>
      
      <div style={{
        border: 'none',
        height: '1px',
        background: 'linear-gradient(to right, transparent, #cbd5e0, transparent)',
        margin: '15px 0'
      }}></div>
      
      <div style={{
        margin: '8px 0',
        fontSize: '13px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontWeight: 600, color: '#4a5568' }}>Client:</span>
        <span style={{ color: '#2d3748' }}>{seance.client_prenom} {seance.client_nom}</span>
      </div>
      
      <div style={{
        margin: '8px 0',
        fontSize: '13px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontWeight: 600, color: '#4a5568' }}>Date:</span>
        <span style={{ color: '#2d3748' }}>
          {new Date(seance.date_jour).toLocaleDateString('fr-FR', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
      
      <div style={{
        margin: '8px 0',
        fontSize: '13px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontWeight: 600, color: '#4a5568' }}>Durée:</span>
        <span style={{ color: '#2d3748' }}>
          {seance.nombre_heures} heure{seance.nombre_heures > 1 ? 's' : ''}
        </span>
      </div>
      
      {seance.coach_details && (
        <div style={{
          margin: '8px 0',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontWeight: 600, color: '#4a5568' }}>Coach:</span>
          <span style={{ color: '#2d3748' }}>
            {seance.coach_details.prenom} {seance.coach_details.nom}
          </span>
        </div>
      )}
      
      <div style={{
        margin: '8px 0',
        fontSize: '13px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontWeight: 600, color: '#4a5568' }}>Montant:</span>
        <span style={{ color: '#2d3748' }}>
          {seance.montant_paye.toLocaleString()} FCFA
        </span>
      </div>
      
      <div style={{
        border: 'none',
        height: '1px',
        background: 'linear-gradient(to right, transparent, #cbd5e0, transparent)',
        margin: '15px 0'
      }}></div>
      
      <div style={{
        margin: '8px 0',
        fontSize: '13px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontWeight: 600, color: '#4a5568' }}>ID de séance:</span>
        <span style={{ color: '#2d3748' }}>
          #{String(seance.id).padStart(6, '0')}
        </span>
      </div>
      
      <div style={{
        textAlign: 'center',
        margin: '15px 0',
        padding: '10px',
        fontFamily: "'Libre Barcode 39', monospace",
        fontSize: '24px',
        letterSpacing: '2px'
      }}>
        *{String(seance.id).padStart(6, '0')}*
      </div>
      
      <div style={{
        textAlign: 'center',
        margin: '20px 0',
        fontStyle: 'italic',
        color: '#4a5568',
        fontSize: '14px'
      }}>
        Merci pour votre confiance ! Nous vous remercions de choisir GYM PREMIUM pour votre entraînement.
      </div>
      
      <div style={{
        marginTop: '25px',
        fontSize: '11px',
        textAlign: 'center',
        color: '#718096',
        paddingTop: '15px',
        borderTop: '1px solid #edf2f7'
      }}>
        <strong>GYM PREMIUM</strong><br />
        Abidjan, Côte d'Ivoire<br />
        Tél: +225 XX XX XX XX | Email: contact@gympremium.ci<br />
        www.gympremium.ci
      </div>
      
      <div style={{
        marginTop: '10px',
        fontSize: '10px',
        textAlign: 'center',
        color: '#a0aec0'
      }}>
        {new Date().toLocaleDateString('fr-FR')} - {new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
};

export default SeanceTicket;
