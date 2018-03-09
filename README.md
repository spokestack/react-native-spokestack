
# spokestack-react-native

React Native wrapper for the [https://github.com/pylon/spokestack-android](Spokestack) speech activity detection/automated speech recognition project.

## Getting started

`$ npm install spokestack-react-native --save`

### Mostly automatic installation

`$ react-native link spokestack-react-native`

### Manual installation


#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.pylon.RNSpokestack.RNSpokestackPackage;` to the imports at the top of the file
  - Add `new RNSpokestackPackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':RNSpokestack'
  	project(':RNSpokestack').projectDir = new File(rootProject.projectDir, 	'../node_modules/spokestack-react-native/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':RNSpokestack')
  	```


## Usage
```javascript
import RNSpokestack from 'spokestack-react-native';

// TODO: What to do with the module?
RNSpokestack;
```

## License

Copyright 2018 Pylon, Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
