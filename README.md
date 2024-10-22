# Bible Trainer

Scripture memorization mobile application.

Find out more at [www.bibletrainer.co.uk](https://www.bibletrainer.co.uk).

## Download the app

- [iOS](https://itunes.apple.com/us/app/bibletrainer/id1447626377)
- [Android](https://play.google.com/store/apps/details?id=io.bibletrainer.scripture)

## Contributing and feature requests

There are an increasing number of requests, bug fixes and feature ideas. We're aiming to put something (small) our each month on a cycle of month one: feature, month two improvement. Please see the [project board](https://github.com/johnraftery/BibleTrainer/projects/1) for more information.

## Development

Bible Trainer is built on top of the [Ionic Framework](https://ionicframework.com).

To get started…

At the moment, this project requires NodeJS v14 and Python 2.7

1. Check out this repo
2. Install Ionic globally: `npm install -g ionic cordova`
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
