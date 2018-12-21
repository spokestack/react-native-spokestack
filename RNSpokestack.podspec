require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'RNSpokestack'
  s.version = package['version']
  s.summary = 'React Native bridge for Pylon\'s Spokestack speech processing pipeline'
  s.homepage = 'https://www.pylon.com'
  s.authors = { 'Spokestack' => 'support@pylon.com' }
  s.source = { :git => "https://github.com/pylon/react-native-spokestack.git", :tag => "0.0.1" }
  s.license = {:type => 'Apache', :file => 'LICENSE'}
  s.ios.deployment_target = '11.0'
  s.swift_version = '4.2'
  s.platform = :ios, "11.0"
  s.source_files  = "*.{h,m}"
  s.requires_arc = true

  s.dependency "SpokeStack", "0.0.2"
end
