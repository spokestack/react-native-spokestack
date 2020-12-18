import { PermissionsAndroid, Platform } from 'react-native'

export default async function checkPermission() {
  // Android SDK 23+ requires you to request permission
  // for certain "dangerous" permissions, which
  // includes RECORD_AUDIO
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    )
    if (!granted) {
      return PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'The microphone is needed to hear your voice.',
          buttonPositive: 'Grant access'
        }
      ).then((value) => value === 'granted')
    }
  }

  // iOS brings up its own dialogs automatically
  // However, the best way to handle permissions is
  // to request speech recognition access in an
  // onboarding screen for your app that
  // explains why the permissions are needed.
  return true
}
