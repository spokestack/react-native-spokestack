import { Image } from 'react-native'
import type { RequireSource } from './types'

export default function resolveModelUrl(source: RequireSource) {
  const result = Image.resolveAssetSource(source)
  return result?.uri
}
