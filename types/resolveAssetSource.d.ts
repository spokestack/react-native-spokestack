import type { ImageProps } from 'react-native'

declare module 'react-native/Libraries/Image/resolveAssetSource' {
  export default function resolveAssetSource(source: ImageProps['source']): {
    uri: string
  }
}
