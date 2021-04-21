require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-spokestack"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["contributors"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/spokestack/react-native-spokestack.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.requires_arc = true
  s.static_framework = true

  s.dependency "Spokestack-iOS", "14.0.6"
  s.dependency "React"
end
