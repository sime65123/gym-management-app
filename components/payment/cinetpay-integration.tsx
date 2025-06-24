"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Wallet, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api"

interface CinetPayIntegrationProps {
  amount: number
  type: "recharge" | "abonnement" | "seance"
  itemId?: number
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function CinetPayIntegration({ amount, type, itemId, onSuccess, onError }: CinetPayIntegrationProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [useBalance, setUseBalance] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    setError("")

    try {
      let response

      if (type === "recharge") {
        // Recharge du compte via CinetPay
        response = await apiClient.rechargeCompte(amount)
      } else {
        // Paiement d'abonnement ou séance
        const paymentData: any = {
          montant: amount,
          use_balance: useBalance,
        }

        if (type === "abonnement" && itemId) {
          paymentData.abonnement = itemId
        } else if (type === "seance" && itemId) {
          paymentData.seance = itemId
        }

        response = await apiClient.initPaiement(paymentData)
      }

      // Si CinetPay retourne une URL de paiement, rediriger
      if (response.cinetpay_response?.payment_url) {
        window.location.href = response.cinetpay_response.payment_url
      } else if (response.status === "PAYE" || response.mode_paiement === "SOLDE") {
        // Paiement réussi avec le solde
        onSuccess?.()
      } else {
        setError("Erreur lors de l'initialisation du paiement")
        onError?.("Erreur lors de l'initialisation du paiement")
      }
    } catch (error: any) {
      const errorMessage = error.message || "Erreur lors du paiement"
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentTitle = () => {
    switch (type) {
      case "recharge":
        return "Recharger votre compte"
      case "abonnement":
        return "Payer l'abonnement"
      case "seance":
        return "Payer la séance"
      default:
        return "Effectuer le paiement"
    }
  }

  const getPaymentDescription = () => {
    switch (type) {
      case "recharge":
        return "Ajoutez des fonds à votre compte via CinetPay"
      case "abonnement":
        return "Payez votre abonnement de manière sécurisée"
      case "seance":
        return "Payez votre séance de manière sécurisée"
      default:
        return "Paiement sécurisé avec CinetPay"
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {getPaymentTitle()}
        </CardTitle>
        <CardDescription>{getPaymentDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Montant à payer</Label>
          <div className="text-2xl font-bold text-blue-600">{amount.toLocaleString()} FCFA</div>
        </div>

        {type !== "recharge" && (
          <div className="space-y-3">
            <Label>Mode de paiement</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="cinetpay"
                  name="payment-method"
                  checked={!useBalance}
                  onChange={() => setUseBalance(false)}
                />
                <label htmlFor="cinetpay" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  Payer avec CinetPay
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="balance"
                  name="payment-method"
                  checked={useBalance}
                  onChange={() => setUseBalance(true)}
                />
                <label htmlFor="balance" className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="h-4 w-4" />
                  Utiliser mon solde
                </label>
              </div>
            </div>
          </div>
        )}

        <Button onClick={handlePayment} disabled={loading} className="w-full">
          {loading ? (
            "Traitement en cours..."
          ) : (
            <>
              {type === "recharge" ? (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Recharger via CinetPay
                </>
              ) : useBalance ? (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Payer avec mon solde
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payer avec CinetPay
                </>
              )}
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <p>Paiement sécurisé par CinetPay</p>
          <p>Vos données sont protégées</p>
        </div>
      </CardContent>
    </Card>
  )
}
