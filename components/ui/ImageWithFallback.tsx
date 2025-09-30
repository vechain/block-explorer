import { Box, Skeleton } from '@chakra-ui/react'
import Image, { type ImageProps } from 'next/image'
import { type CSSProperties, useState } from 'react'

const imgStyle: CSSProperties = {
  borderRadius: '8px',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.400',
  position: 'absolute',
  top: 0,
  left: 0,
}

export const ImageWithFallback = ({ src, width = 100, height = 100, onLoad, onError, ...props }: ImageProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.(event)
  }

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false)
    setHasError(true)
    onError?.(event)
  }

  return (
    <Box position="relative" width={width} height={height}>
      {isLoading && <Skeleton width={width} height={height} style={{ zIndex: 2, ...imgStyle }} />}

      <Image
        src={src}
        width={width}
        height={height}
        style={{ objectFit: 'contain', width: '100%', height: '100%', ...imgStyle }}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {hasError && (
        <Image src="/no-image.png" width={width} height={height} style={{ zIndex: 1, ...imgStyle }} {...props} />
      )}
    </Box>
  )
}
