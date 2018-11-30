
Pod::Spec.new do |s|
  s.name         = "RNSpokestack"
  s.version      = "1.0.0"
  s.summary      = "RNSpokestack"
  s.description  = <<-DESC
                  RNSpokestack
                   DESC
  s.homepage     = ""
  s.license      = "Apache"
  s.author             = { "author" => "noel@pylon.com" }
  s.platform     = :ios, "11.0"
  s.source       = { :git => "https://github.com/author/RNSpokestack.git", :tag => "master" }
  s.source_files  = "RNSpokestack/**/*.{h,m}"
  s.requires_arc = true


  s.dependency "React"
  s.dependency pod 'SpokeStack', :path => '~/w/spokestack-ios-pod/SpokeStack/0.0.4'

  end
end
