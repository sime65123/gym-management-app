'use client'

import * as React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs as ShadcnTabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TabItem {
  value: string
  label: string
  content: React.ReactNode
}

interface ResponsiveTabsProps {
  defaultValue: string
  tabs: TabItem[]
  className?: string
  tabListClassName?: string
  tabTriggerClassName?: string
}

export function ResponsiveTabs({
  defaultValue,
  tabs,
  className,
  tabListClassName,
  tabTriggerClassName,
}: ResponsiveTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  // Déterminer l'onglet actif en fonction de l'URL ou de la valeur par défaut
  const activeTab = React.useMemo(() => {
    // Vérifier si le paramètre d'URL correspond à un onglet valide
    const validTab = tabs.some(tab => tab.value === tabParam)
    return validTab ? tabParam : defaultValue
  }, [tabParam, defaultValue, tabs])

  // Mettre à jour l'URL lorsque l'onglet change
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Version mobile - Menu déroulant */}
      <div className="md:hidden mb-4">
        <Select value={activeTab} onValueChange={handleTabChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner une section" />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Version desktop - Onglets horizontaux */}
      <ShadcnTabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="hidden md:block"
      >
        <TabsList className={cn("w-full justify-start overflow-x-auto", tabListClassName)}>
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className={cn("whitespace-nowrap", tabTriggerClassName)}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </ShadcnTabs>

      {/* Contenu des onglets - Affiche uniquement l'onglet actif */}
      <div className="mt-4">
        {tabs.map((tab) => 
          activeTab === tab.value ? (
            <div key={tab.value}>
              {tab.content}
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}
