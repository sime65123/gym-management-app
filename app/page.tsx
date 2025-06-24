"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Zap,
  Users,
  Calendar,
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Award,
  Target,
  Heart,
  Shield,
  UserCheck,
  AlertCircle,
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
    "/placeholder.svg?height=600&width=1200&text=Salle+de+Musculation",
    "/placeholder.svg?height=600&width=1200&text=Cours+de+Fitness",
    "/placeholder.svg?height=600&width=1200&text=Espace+Cardio",
    "/placeholder.svg?height=600&width=1200&text=Piscine+et+Spa",
  ]

  // Témoignages clients
  const testimonials = [
    {
      name: "Marie Kouassi",
      rating: 5,
      comment: "Excellente salle avec des équipements modernes. Les coachs sont très professionnels et à l'écoute.",
      image: "/placeholder.svg?height=80&width=80&text=MK",
    },
    {
      name: "Jean-Baptiste Yao",
      rating: 5,
      comment: "Ambiance conviviale et motivante. J'ai atteint mes objectifs grâce à l'accompagnement personnalisé.",
      image: "/placeholder.svg?height=80&width=80&text=JY",
    },
    {
      name: "Fatou Traoré",
      rating: 4,
      comment: "Très bonne salle, horaires flexibles et système de réservation en ligne très pratique.",
      image: "/placeholder.svg?height=80&width=80&text=FT",
    },
    {
      name: "Koffi Asante",
      rating: 5,
      comment: "Infrastructure de qualité, personnel accueillant. Je recommande vivement GYM ZONE !",
      image: "/placeholder.svg?height=80&width=80&text=KA",
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
      await login(loginData.email, loginData.password)
      setIsLoginDialogOpen(false)
      setLoginData({ email: "", password: "" })
    } catch (error: any) {
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
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-yellow-400 animated-logo" />
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

                  <Tabs defaultValue="client" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="client" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Client
                      </TabsTrigger>
                      <TabsTrigger value="staff" className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Personnel
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="client" className="space-y-4 mt-4">
                      {loginError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{loginError}</AlertDescription>
                        </Alert>
                      )}
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="client-login-email">Email</Label>
                          <Input
                            id="client-login-email"
                            type="email"
                            placeholder="votre@email.com"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="client-login-password">Mot de passe</Label>
                          <Input
                            id="client-login-password"
                            type="password"
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={loginLoading}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {loginLoading ? "Connexion..." : "Se connecter - Client"}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="staff" className="space-y-4 mt-4">
                      {loginError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{loginError}</AlertDescription>
                        </Alert>
                      )}
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="staff-login-email">Email</Label>
                          <Input
                            id="staff-login-email"
                            type="email"
                            placeholder="votre@email.com"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-login-password">Mot de passe</Label>
                          <Input
                            id="staff-login-password"
                            type="password"
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loginLoading}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          {loginLoading ? "Connexion..." : "Se connecter - Personnel"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
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
                  Paiements en ligne sécurisés avec CinetPay et recharge de compte
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
                Depuis plus de 10 ans, GYM ZONE est la référence en matière de fitness en Côte d'Ivoire. Nous offrons un
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

            <div className="relative">
              <img
                src="/placeholder.svg?height=500&width=600&text=Notre+Équipe"
                alt="Notre équipe"
                className="rounded-lg shadow-lg"
              />
              <div className="absolute -bottom-6 -left-6 bg-blue-600 text-white p-6 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Award className="h-8 w-8 animated-logo" />
                  <div>
                    <div className="font-bold">Certifié ISO</div>
                    <div className="text-sm">Qualité garantie</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Pourquoi Choisir GYM ZONE ?</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nous nous distinguons par notre approche personnalisée et nos installations de qualité
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Target className="h-10 w-10 text-blue-600 animated-logo" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Objectifs Personnalisés</h4>
              <p className="text-gray-600">Programme adapté à vos besoins et objectifs spécifiques</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-10 w-10 text-green-600 animated-logo" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Équipements Modernes</h4>
              <p className="text-gray-600">Matériel de dernière génération régulièrement renouvelé</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-10 w-10 text-purple-600 animated-logo" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Horaires Flexibles</h4>
              <p className="text-gray-600">Ouvert 7j/7 avec des créneaux adaptés à votre emploi du temps</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-orange-600 animated-logo" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Résultats Garantis</h4>
              <p className="text-gray-600">Suivi personnalisé pour des résultats visibles et durables</p>
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
                    <img
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full mx-auto mb-3"
                    />
                    <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                    <div className="flex justify-center space-x-1 mt-2">{renderStars(testimonial.rating)}</div>
                  </div>
                  <p className="text-gray-600 text-center italic">"{testimonial.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Nos Tarifs</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choisissez l'abonnement qui correspond à vos besoins et votre budget
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Découverte</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mt-4">
                  15,000 <span className="text-lg text-gray-600">FCFA</span>
                </div>
                <p className="text-gray-600">Par mois</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Accès salle de musculation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Zone cardio
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Vestiaires et douches
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">Choisir ce plan</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-2 border-blue-600 shadow-lg relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">Populaire</Badge>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Premium</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mt-4">
                  25,000 <span className="text-lg text-gray-600">FCFA</span>
                </div>
                <p className="text-gray-600">Par mois</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Tout du plan Découverte
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Cours collectifs illimités
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />1 séance coaching/mois
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Accès piscine
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">Choisir ce plan</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">VIP</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mt-4">
                  40,000 <span className="text-lg text-gray-600">FCFA</span>
                </div>
                <p className="text-gray-600">Par mois</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Tout du plan Premium
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Coaching personnel illimité
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Accès spa et sauna
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Programme nutrition
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">Choisir ce plan</Button>
              </CardContent>
            </Card>
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
                    <div className="text-gray-600">Cocody, Riviera Golf, Abidjan, Côte d'Ivoire</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-6 w-6 text-blue-600 mr-4" />
                  <div>
                    <div className="font-semibold">Téléphone</div>
                    <div className="text-gray-600">+225 27 22 XX XX XX</div>
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
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">t</span>
                </div>
                <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">i</span>
                </div>
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
                <p>Cocody, Riviera Golf</p>
                <p>Abidjan, Côte d'Ivoire</p>
                <p>+225 27 22 XX XX XX</p>
                <p>contact@gymzone.ci</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2024 GYM ZONE. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
