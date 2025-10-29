"use client"

import { useState } from "react"
import { ExternalLink, ChevronDown, ChevronRight } from "lucide-react"
import type { Link, Section } from "@/types"
import { CarouselSection } from "@/components/CarouselSection"

interface ExpandableSectionsProps {
  links: Link[]
  sections: Section[]
  theme: {
    backgroundColor: string
    textColor: string
    buttonColor: string
    buttonTextColor: string
  }
}

export function ExpandableSections({ links, sections = [], theme }: ExpandableSectionsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  
  // Debug logs
  console.log("ExpandableSections - links:", links.length)
  console.log("ExpandableSections - sections:", sections.length)
  console.log("ExpandableSections - sections data:", sections)

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  // Organizar enlaces por sección
  const linksWithoutSection = links.filter(link => !link.sectionId)
  const linksBySection = sections.reduce((acc, section) => {
    acc[section.id] = links.filter(link => link.sectionId === section.id)
    return acc
  }, {} as Record<string, Link[]>)

  if (links.length === 0) {
    return (
      <div className="text-center py-12 opacity-60">
        <p>No hay enlaces disponibles</p>
      </div>
    )
  }

  // Si no hay secciones, mostrar enlaces normalmente
  if (sections.length === 0) {
    return (
      <div className="space-y-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target={link.type === "external" ? "_blank" : "_self"}
            rel={link.type === "external" ? "noopener noreferrer" : undefined}
            className="block w-full px-4 py-2 rounded-lg transition-all hover:scale-105 hover:shadow-lg"
            style={{
              backgroundColor: theme.buttonColor,
              color: theme.buttonTextColor,
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <h3 className="font-semibold text-lg leading-tight">{link.title}</h3>
              {link.type === "external" && <ExternalLink className="h-4 w-4 flex-shrink-0" />}
            </div>
            {link.description && (
              <p className="text-xs opacity-90 leading-tight text-center mt-1">
                {link.description}
              </p>
            )}
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Enlaces sin sección */}
      {linksWithoutSection.length > 0 && (
        <div className="space-y-3">
          {linksWithoutSection.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target={link.type === "external" ? "_blank" : "_self"}
              rel={link.type === "external" ? "noopener noreferrer" : undefined}
              className="block w-full px-4 py-2 rounded-lg transition-all hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: theme.buttonColor,
                color: theme.buttonTextColor,
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <h3 className="font-semibold text-lg leading-tight">{link.title}</h3>
                {link.type === "external" && <ExternalLink className="h-4 w-4 flex-shrink-0" />}
              </div>
              {link.description && (
                <p className="text-xs opacity-90 leading-tight text-center mt-1">
                  {link.description}
                </p>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Secciones */}
      {sections.map((section) => {
        const sectionLinks = linksBySection[section.id] || []
        
        // Si es un carrusel, renderizar directamente
        if (section.type === 'carousel' && section.carouselId) {
          return (
            <div key={section.id} className="space-y-2">
              {/* Título de la sección */}
              <div 
                className="w-full p-3 rounded-lg"
                style={{
                  backgroundColor: theme.buttonColor + "20",
                  border: `1px solid ${theme.buttonColor}40`,
                }}
              >
                <span className="font-medium text-lg" style={{ color: theme.textColor }}>
                  {section.title}
                </span>
              </div>
              
              {/* Carrusel */}
              <CarouselSection carouselId={section.carouselId} theme={theme} />
            </div>
          )
        }

        // Sección de enlaces (expandible)
        if (sectionLinks.length === 0) return null

        const isExpanded = expandedSections.has(section.id)

        return (
          <div key={section.id} className="space-y-2">
            {/* Header de la sección */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-3 rounded-lg transition-all hover:opacity-80"
              style={{
                backgroundColor: theme.buttonColor + "20", // 20% opacity
                color: theme.textColor,
                border: `1px solid ${theme.buttonColor}40`, // 40% opacity
              }}
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium text-lg">{section.title}</span>
                <span className="text-sm opacity-70">({sectionLinks.length})</span>
              </div>
            </button>

            {/* Enlaces de la sección (expandible) */}
            {isExpanded && (
              <div className="space-y-2 ml-4">
                {sectionLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target={link.type === "external" ? "_blank" : "_self"}
                    rel={link.type === "external" ? "noopener noreferrer" : undefined}
                    className="block w-full px-4 py-2 rounded-lg transition-all hover:scale-105 hover:shadow-lg"
                    style={{
                      backgroundColor: theme.buttonColor,
                      color: theme.buttonTextColor,
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="font-semibold text-lg leading-tight">{link.title}</h3>
                      {link.type === "external" && <ExternalLink className="h-4 w-4 flex-shrink-0" />}
                    </div>
                    {link.description && (
                      <p className="text-xs opacity-90 leading-tight text-center mt-1">
                        {link.description}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
