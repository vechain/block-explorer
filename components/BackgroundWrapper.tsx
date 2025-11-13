'use client'

import { useEffect } from 'react'

export const BackgroundWrapper = () => {
  useEffect(() => {
    const updateBackground = () => {
      const body = document.body
      
      if (window.innerWidth >= 768) {
        body.style.backgroundImage = 'url(/bg/Desktop.jpg)'
        body.style.backgroundAttachment = 'fixed'
      } else {
        body.style.backgroundImage = 'url(/bg/Mobile.jpg)'
        body.style.backgroundAttachment = 'scroll'
      }
    }
    
    // Ensure body expands to cover all content
    const updateBodySize = () => {
      const body = document.body
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      )
      const scrollWidth = Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.body.clientWidth,
        document.documentElement.clientWidth
      )
      
      body.style.minHeight = `${Math.max(scrollHeight, window.innerHeight)}px`
      body.style.minWidth = `${Math.max(scrollWidth, window.innerWidth)}px`
    }
    
    const handleResize = () => {
      updateBackground()
      updateBodySize()
    }
    
    updateBackground()
    updateBodySize()
    
    // Update on resize
    window.addEventListener('resize', handleResize)
    
    // Use MutationObserver to detect content changes
    const observer = new MutationObserver(updateBodySize)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    })
    
    // Initial update after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      updateBodySize()
    }, 100)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, [])

  return null
}

