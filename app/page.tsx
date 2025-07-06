"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Heart,
  Lock,
  LogIn,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Shield,
  Star,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth/auth-context"

export default function HomePage() {
  const { login, register } = useAuth()
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({
    email: "",
    nom: "",
    prenom: "",
    password: "",
    telephone: "",
  })
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loginError, setLoginError] = useState("")
  const [registerError, setRegisterError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)

  // Images du carousel (placeholder)
  const gymImages = [
    "/ima.jpg",
    "/imb.jpg",
    "/im3.jpg",
  ]

  // Récupération des abonnements
  const [abonnements, setAbonnements] = useState([
    {
      id: 1,
      nom: 'Découverte',
      description: 'Accès à la salle de sport avec équipements de base',
      prix: 15000,
      duree_jours: 30,
      avantages: [
        'Accès salle de musculation',
        'Zone cardio',
        'Vestiaires et douches'
      ]
    },
    {
      id: 2,
      nom: 'Premium',
      description: 'Accès complet à tous les équipements et services',
      prix: 25000,
      duree_jours: 30,
      avantages: [
        'Tout du plan Découverte',
        'Cours collectifs illimités',
        '1 séance coaching/mois',
        'Accès piscine'
      ]
    },
    {
      id: 3,
      nom: 'VIP',
      description: 'Service premium avec accompagnement personnalisé',
      prix: 40000,
      duree_jours: 30,
      avantages: [
        'Tout du plan Premium',
        'Coaching personnel illimité',
        'Accès prioritaire',
        'Suivi nutritionnel',
        'Sauna et hammam'
      ]
    }
  ]);

  // Témoignages clients
  const testimonials = [
    {
      name: "Aïcha Assam",
      rating: 5,
      comment: "Après 6 mois d'entraînement chez GYM ZONE, j'ai perdu 12kg et gagné en confiance. Les coachs sont exceptionnels et les programmes adaptés à tous les niveaux.",
      image: "/e1.jpg",
      poste: "Entrepreneure, 32 ans"
    },
    {
      name: "Didier Kenfack",
      rating: 5,
      comment: "En tant que sportif confirmé, je cherchais une salle avec des équipements professionnels. GYM ZONE a dépassé mes attentes avec son matériel de qualité et son espace de musculation spacieux.",
      image: "/e2.jpg",
      poste: "Coach sportif, 28 ans"
    },
    {
      name: "junior fongang",
      rating: 5,
      comment: "L'accueil est chaleureux et les horaires d'ouverture sont parfaits pour mon emploi du temps chargé. J'apprécie particulièrement les cours collectifs dynamiques.",
      image: "/e3.jpg",
      poste: "Avocat, 35 ans"
    },
    {
      name: "Yves kengne",
      rating: 5,
      comment: "Après une blessure, j'avais besoin d'un accompagnement personnalisé. Les coachs de GYM ZONE m'ont aidé à me remettre en forme en douceur et en sécurité.",
      image: "/e4.jpg",
      poste: "Comptable, 36ans"
    },
  ]

  // Auto-slide du carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % gymImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [gymImages.length])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setLoginLoading(true)

    try {
      // Appeler la fonction login qui va maintenant retourner l'utilisateur connecté
      const user = await login(loginData.email, loginData.password)
      
      // Mettre à jour les états
      setIsLoginDialogOpen(false)
      setLoginData({ email: "", password: "" })
      
      // La redirection est maintenant gérée dans le contexte d'authentification
      // après la mise à jour de l'état utilisateur
      
      console.log('Utilisateur connecté avec succès:', user)
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error)
      setLoginError(error.message || "Erreur de connexion")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError("")
    setRegisterLoading(true)

    try {
      await register(registerData)
      setIsRegisterDialogOpen(false)
      setRegisterData({
        email: "",
        nom: "",
        prenom: "",
        password: "",
        telephone: "",
      })
    } catch (error: any) {
      setRegisterError(error.message || "Erreur lors de l'inscription")
    } finally {
      setRegisterLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % gymImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + gymImages.length) % gymImages.length)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full overflow-hidden shadow-md border-2 border-white">
                <img 
                  src="/lg1.jpg" 
                  alt="Logo GYM ZONE" 
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">GYM ZONE</h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <a href="#accueil" className="text-gray-600 hover:text-blue-600 transition-colors">
                Accueil
              </a>
              <a href="#services" className="text-gray-600 hover:text-blue-600 transition-colors">
                Services
              </a>
              <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">
                À propos
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">
                Témoignages
              </a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                Contact
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              {/* Login Dialog */}
              <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Connexion</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Connexion</DialogTitle>
                    <DialogDescription>Connectez-vous à votre compte GYM ZONE</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {loginError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{loginError}</AlertDescription>
                      </Alert>
                    )}
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="flex items-center gap-2 text-gray-700">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="votre@email.com"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="flex items-center gap-2 text-gray-700">
                          <Lock className="h-4 w-4" />
                          Mot de passe
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <a href="#" className="text-sm text-blue-600 hover:underline">Mot de passe oublié ?</a>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                        disabled={loginLoading}
                      >
                        {loginLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogIn className="h-4 w-4" />
                        )}
                        {loginLoading ? "Connexion en cours..." : "Se connecter"}
                      </Button>
                    </form>
                    <div className="relative mt-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Nouveau sur GYM ZONE ?</span>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Register Dialog */}
              <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">S'inscrire</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Inscription</DialogTitle>
                    <DialogDescription>Créez votre compte pour accéder à nos services</DialogDescription>
                  </DialogHeader>
                  {registerError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{registerError}</AlertDescription>
                    </Alert>
                  )}
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-prenom">Prénom</Label>
                        <Input
                          id="register-prenom"
                          placeholder="Prénom"
                          value={registerData.prenom}
                          onChange={(e) => setRegisterData({ ...registerData, prenom: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-nom">Nom</Label>
                        <Input
                          id="register-nom"
                          placeholder="Nom"
                          value={registerData.nom}
                          onChange={(e) => setRegisterData({ ...registerData, nom: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-telephone">Téléphone</Label>
                      <Input
                        id="register-telephone"
                        type="tel"
                        placeholder="+225 XX XX XX XX"
                        value={registerData.telephone}
                        onChange={(e) => setRegisterData({ ...registerData, telephone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Mot de passe</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={registerLoading}>
                      {registerLoading ? "Inscription..." : "S'inscrire"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Carousel */}
      <section id="accueil" className="relative h-[600px] overflow-hidden">
        <div className="relative h-full">
          {gymImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={image || "/placeholder.svg"}
                alt={`Gym image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50" />
            </div>
          ))}

          {/* Carousel Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {gymImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide ? "bg-white" : "bg-white bg-opacity-50"
                }`}
              />
            ))}
          </div>

          {/* Hero Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-4xl px-4">
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Transformez Votre <span className="text-blue-400">Corps</span>
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                Rejoignez la meilleure salle de sport de Côte d'Ivoire avec des équipements modernes et des coachs
                professionnels
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
                  onClick={() => setIsRegisterDialogOpen(true)}
                >
                  Commencer Maintenant
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-3"
                >
                  Découvrir nos Services
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Nos Services</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez notre gamme complète de services conçus pour vous aider à atteindre vos objectifs fitness
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="text-center">
                <div className="bg-blue-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Zap className="h-10 w-10 text-yellow-400 animated-logo" />
                </div>
                <CardTitle className="text-xl">Musculation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Équipements de musculation dernière génération pour tous niveaux
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="text-center">
                <div className="bg-green-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Heart className="h-10 w-10 text-green-600 animated-logo" />
                </div>
                <CardTitle className="text-xl">Cardio Training</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Zone cardio complète avec tapis, vélos et équipements modernes
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="text-center">
                <div className="bg-purple-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-purple-600 animated-logo" />
                </div>
                <CardTitle className="text-xl">Cours Collectifs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">Fitness, Zumba, Yoga et bien d'autres cours avec nos coachs</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="text-center">
                <div className="bg-orange-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <UserCheck className="h-10 w-10 text-orange-600 animated-logo" />
                </div>
                <CardTitle className="text-xl">Coaching Personnel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">Accompagnement personnalisé avec nos coachs certifiés</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="text-center">
                <div className="bg-red-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-red-600 animated-logo" />
                </div>
                <CardTitle className="text-xl">Réservation en Ligne</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Système de réservation simple et efficace via notre plateforme
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="text-center">
                <div className="bg-cyan-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-10 w-10 text-cyan-600 animated-logo" />
                </div>
                <CardTitle className="text-xl">Paiement Sécurisé</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Paiements sécurisés sur place avec tickets de paiement
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-4xl font-bold text-gray-900 mb-6">À Propos de GYM ZONE</h3>
              <p className="text-lg text-gray-600 mb-6">
                 GYM ZONE est la référence en matière de fitness  a yaounde . Nous offrons un
                environnement moderne, sécurisé et motivant pour tous ceux qui souhaitent améliorer leur condition
                physique et leur bien-être.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Notre équipe de coachs certifiés vous accompagne dans l'atteinte de vos objectifs, que vous soyez
                débutant ou athlète confirmé.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">5000+</div>
                  <div className="text-gray-600">Membres Actifs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">15+</div>
                  <div className="text-gray-600">Coachs Certifiés</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">10+</div>
                  <div className="text-gray-600">Années d'Expérience</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                  <div className="text-gray-600">Support Client</div>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="relative w-full h-96 mb-6 rounded-xl overflow-hidden shadow-xl bg-gray-100">
                <img
                  src="/imc.jpg"
                  alt="Installations GYM ZONE"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative w-full h-96 rounded-xl overflow-hidden shadow-xl bg-gray-100">
                <img
                  src="/imd.jpg"
                  alt="Équipements modernes"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full mb-4">
              Pourquoi nous choisir ?
            </span>
            <h3 className="text-4xl font-bold text-gray-900 mb-4">L'Excellence en Fitness</h3>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez ce qui fait de GYM ZONE le choix idéal pour atteindre vos objectifs fitness
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group relative p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-10 w-10 text-blue-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Objectifs Personnalisés</h4>
                <p className="text-gray-600">Programme sur mesure adapté à vos besoins spécifiques et à votre rythme.</p>
                <div className="mt-4">
                  <span className="inline-flex items-center text-blue-600 font-medium group-hover:underline">
                    En savoir plus
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>

            <div className="group relative p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-10 w-10 text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Équipements Modernes</h4>
                <p className="text-gray-600">Matériel dernier cri pour des entraînements optimaux et sécurisés.</p>
                <div className="mt-4">
                  <span className="inline-flex items-center text-green-600 font-medium group-hover:underline">
                    Découvrir
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>

            <div className="group relative p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-10 w-10 text-purple-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Horaires Flexibles</h4>
                <p className="text-gray-600">Ouvert 7j/7 pour s'adapter à votre emploi du temps chargé.</p>
                <div className="mt-4">
                  <span className="inline-flex items-center text-purple-600 font-medium group-hover:underline">
                    Voir les horaires
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>

            <div className="group relative p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-10 w-10 text-orange-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Résultats Garantis</h4>
                <p className="text-gray-600">Suivi personnalisé pour des progrès visibles et durables.</p>
                <div className="mt-4">
                  <span className="inline-flex items-center text-orange-600 font-medium group-hover:underline">
                    Nos résultats
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Ce Que Disent Nos Membres</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez les témoignages de nos membres satisfaits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <div className="relative w-20 h-20 mx-auto mb-3">
                      <img
                        src={testimonial.image || "/placeholder.svg"}
                        alt={testimonial.name}
                        className="w-full h-full rounded-full object-cover border-2 border-blue-100"
                      />
                    </div>
                    <h4 className="font-bold text-lg text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{testimonial.poste}</p>
                    <div className="flex justify-center space-x-1">{renderStars(testimonial.rating)}</div>
                  </div>
                  <p className="text-gray-600 text-center italic">"{testimonial.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 bg-blue-50 text-blue-600 border-blue-200 text-sm font-medium">
              Nos Offres
            </Badge>
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Choisissez Votre Formule</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des abonnements adaptés à tous les objectifs et à tous les budgets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {abonnements.map((abonnement, index) => (
              <div key={abonnement.id} className="relative">
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1 text-sm font-medium">
                      Le plus populaire
                    </Badge>
                  </div>
                )}
                <Card className={`h-full flex flex-col transition-all duration-300 hover:shadow-xl ${
                  index === 1 ? 'border-2 border-blue-500 transform scale-105' : 'border border-gray-200'
                }`}>
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold text-gray-800">{abonnement.nom}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-extrabold text-blue-600">
                        {new Intl.NumberFormat('fr-FR').format(abonnement.prix)}
                      </span>
                      <span className="text-gray-500 ml-1">FCFA</span>
                      <p className="text-sm text-gray-500 mt-1">pour {abonnement.duree_jours} jours</p>
                    </div>
                    <p className="text-gray-600 mt-2 text-sm">{abonnement.description}</p>
                  </CardHeader>
                  <CardContent className="pt-2 flex-grow">
                    <ul className="space-y-3 mb-6">
                      {abonnement.avantages.map((avantage, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{avantage}</span>
                        </li>
                      ))}
                    </ul>
                   
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Vous avez des questions sur nos abonnements ?</p>
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <MessageSquare className="h-4 w-4 mr-2" />
              Nous contacter
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Contactez-Nous</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une question ? N'hésitez pas à nous contacter, notre équipe est là pour vous aider
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h4 className="text-2xl font-semibold mb-6">Informations de Contact</h4>
              <div className="space-y-6">
                <div className="flex items-center">
                  <MapPin className="h-6 w-6 text-blue-600 mr-4" />
                  <div>
                    <div className="font-semibold">Adresse</div>
                    <div className="text-gray-600">Yaounde , Cameroun</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-6 w-6 text-blue-600 mr-4" />
                  <div>
                    <div className="font-semibold">Téléphone</div>
                    <div className="text-gray-600">+237 6XXXXXXXX</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="h-6 w-6 text-blue-600 mr-4" />
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-gray-600">contact@gymzone.ci</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-6 w-6 text-blue-600 mr-4" />
                  <div>
                    <div className="font-semibold">Horaires</div>
                    <div className="text-gray-600">
                      <div>Lun - Ven: 6h - 22h</div>
                      <div>Sam - Dim: 8h - 20h</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Envoyez-nous un Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-nom">Nom</Label>
                      <Input id="contact-nom" placeholder="Votre nom" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input id="contact-email" type="email" placeholder="votre@email.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-sujet">Sujet</Label>
                    <Input id="contact-sujet" placeholder="Sujet de votre message" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Message</Label>
                    <textarea
                      id="contact-message"
                      className="w-full p-3 border border-gray-300 rounded-md resize-none h-32"
                      placeholder="Votre message..."
                    />
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Envoyer le Message</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-8 w-8 text-yellow-400 animated-logo" />
                <span className="text-2xl font-bold">GYM ZONE</span>
              </div>
              <p className="text-gray-400 mb-4">Votre partenaire fitness pour une vie plus saine et plus active.</p>
              <div className="flex space-x-4">
                
              </div>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-4">Services</h5>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Musculation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cardio Training
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cours Collectifs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Coaching Personnel
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-4">Liens Utiles</h5>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#about" className="hover:text-white transition-colors">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-white transition-colors">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="hover:text-white transition-colors">
                    Témoignages
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-4">Contact</h5>
              <div className="space-y-2 text-gray-400">
                <p>Yaounde , Cameroun</p>
                <p>+237 6 XX XX XX</p>
                <p>contact@gymzone.ci</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">©  GYMZONE</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
