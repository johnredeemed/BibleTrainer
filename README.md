# Bible Trainer

Scripture memorization mobile application

## Development

Bible Trainer is built on top of the [Ionic Framework](https://ionicframework.com).

To get started…

1. Check out this repo
2. Install Ionic globally: `npm install -g ionic`
3. Install NPM packages: `npm install`
4. Run the ionic server: `npm run start`

Environment vars are stored in `src/environments`. For deployment you will need to create a file `environment.prod.ts` with relevant keys in it.

## Test builds

### Android

Make sure that you have [Android Studio](https://developer.android.com/studio/index.html) installed and set up.

Then on the CLI run: `ionic cordova run android --prod`

[More details](https://ionicframework.com/docs/intro/deploying/)

### iOS

1. You'll need [Xcode](https://developer.apple.com/xcode/) installed
2. Generate the Xcode files: `ionic cordova build ios --prod`
3. Open the .xcodeproj file in platforms/ios/ in Xcode
4. Connect your phone via USB and select it as the run target
5. Click the play button in Xcode to try to run your app

Get errors? Read the [Ionic documentation](https://ionicframework.com/docs/intro/deploying).
