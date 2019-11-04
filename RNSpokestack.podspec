require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'RNSpokestack'
  s.version = package['version']
  s.summary = 'React Native bridge for the Spokestack speech processing pipeline'
  s.homepage = 'https://www.spokestack.io'
  s.authors = { 'RNSpokestack' => 'support@spokestack.com' }
  s.source = { :git => 'https://github.com/spokestack/react-native-spokestack.git', :tag => package['version'] }
  s.license = {:type => 'Apache', :file => 'LICENSE'}
  s.ios.deployment_target = '11.0'
  s.swift_version = '4.2'
  s.platform = :ios, '11.0'
  s.source_files  = 'ios/*.{h,m}'
  s.requires_arc = true
  s.static_framework = true

  s.dependency "Spokestack-iOS", "4.0.0"
  s.dependency 'React'
end
