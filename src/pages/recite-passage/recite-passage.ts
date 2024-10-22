import { AlertController, Events, NavController, NavParams, ToastController, Platform } from 'ionic-angular';
import { Component, NgZone, ViewChild } from '@angular/core';
import { MusicControls } from '@ionic-native/music-controls';
import { HTTP } from '@ionic-native/http';
import { Storage } from "@ionic/storage";
import { ENV } from '../../environments/environment';
import { EmojiMap } from './emoji-map';

const _SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

@Component({
  selector: 'page-recite-passage',
  templateUrl: 'recite-passage.html'
})

export class RecitePassagePage {
  @ViewChild('content') content:any;

  networkAvailable = true;
  downloadOverWiFi = false;
  reference;
  passage;
  parts: Array<String>;
  shown: Array<String>;
  counter: number;
  currentPhrase: String;
  nextPhrase: String = "";
  nextPhraseStripped: String = "";
  nextWord: String = "";
  endOfPassage: boolean = false;
  previousPassageExists;
  nextPassageExists;
  folder;
  passagesInFolder;
  indexInFolder;
  folderObject;
  speechEnabled = false;
  speechReady = false;
  passageReceived = false;
  passageAudio = null;
  playPauseIcon: String = 'play';
  willPause = false;
  settings;
  contentClass = "recite-passage";

  recognition;
  autoRestartCount = 0;
  isListening = false;
  lastStartedAt;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private storage: Storage,
              private platform: Platform,
              public events: Events,
              private toastCtrl: ToastController,
              public alertCtrl: AlertController,
              private musicControls: MusicControls,
              private http: HTTP,
              // private network: Network,
              private _ngZone: NgZone) {
    this.storage.get("stored_settings").then((settings) => {
      this.settings = settings;
      if (settings.sansforgetica) this.contentClass = "recite-passage forgetica-enabled"
      this.downloadOverWiFi = settings.downloadOverWiFi;
      // this.checkNetworkConnection();
    });

    // this.network.onchange().subscribe(() => {
    //   // We just got a connection but we need to wait briefly
    //   // before we determine the connection type.
    //   // Run in ngZone to make sure UI is updated.
    //   setTimeout(() => {
    //     this._ngZone.run(() => {
    //       if (!this.networkAvailable) { // only check for connection, not disconnection
    //         this.checkNetworkConnection();
    //       }
    //     });
    //   }, 3000);
    // });

    this.shown = [];
    this.counter = 0;

    this.folder = this.navParams.data.folder;
    this.passagesInFolder = this.navParams.data.passagesInFolder;
    this.indexInFolder = this.navParams.data.index;
    this.fetchPassage();
  }

  // checkNetworkConnection() {
  //   if (this.downloadOverWiFi) {
  //     this.networkAvailable = this.network.type && this.network.type == 'wifi';
  //   }
  //   else {
  //     this.networkAvailable = this.network.type && this.network.type !== 'unknown' && this.network.type !== 'none';
  //   }
  // }

  fetchPassage() {
    if (this.passagesInFolder == null || this.indexInFolder == null || this.indexInFolder < 0 || this.indexInFolder >= this.passagesInFolder.length) {
      let toast = this.toastCtrl.create({
        message: 'Could not find passage',
        duration: 2000,
        position: 'bottom'
      });
      toast.present();
      this.navCtrl.pop();
      return;
    }

    this.reference = this.passagesInFolder[this.indexInFolder].reference;
    this.previousPassageExists = this.indexInFolder > 0;
    this.nextPassageExists = this.indexInFolder < this.passagesInFolder.length - 1;

    this.storage.get(this.reference).then((passage) => {
      if (passage == null) {
        let toast = this.toastCtrl.create({
          message: 'Could not find ' + this.reference + ' ... please delete and re-add',
          duration: 2000,
          position: 'bottom'
        });
        toast.present();
        this.navCtrl.pop();
        return;
      }

      this.passage = passage;
      this.storage.get("stored_settings").then((settings) => {
        if (settings.replaceTheLORDwithYHWH) {
          this.passage = this.passage.replace(/(([Tt]he |)LORD)|GOD/g, "YHWH");
        }

        if (this.reference.toLowerCase().startsWith("psalm")) {
          this.parts = this.passage
            .split(/#/)
            .filter((part) => part !== undefined && part.trim() !== '')
            .map((part) => this.checkForIndentAtStartOfVerse(part));
        } else {
          this.parts = [];
          var verses = this.passage
            .split(/\[/)
            .filter((part) => part !== undefined && part.trim() !== '')
            .map((part) => '[' + part);
          verses.forEach(this.splitVerse.bind(this));
        }

        this.parts = this.parts.map(part => {
          if (settings.emojiMode) {
            part = this.addEmojis(part);
          }
          part = this.replaceVerseMarker(part);
          part = this.replaceIndents(part);
          return part;
        });

        this.registerSpeechRecognition();
      });
    });
  }

  checkForIndentAtStartOfVerse(line) {
    if (line.search("\\[[0-9]+\\]&nbsp;&nbsp;&nbsp;&nbsp;.*") != -1) {
      return "&nbsp;&nbsp;&nbsp;&nbsp;" + line.replace("&nbsp;&nbsp;&nbsp;&nbsp;", "");
    }
    return line;
  }

  replaceVerseMarker(line) {
    const verseNumbers = line.match(/\[[0-9]+\]/g);
    if (!verseNumbers || verseNumbers.length < 1) return line;

    const verseNumber = verseNumbers[0].replace(/[\[\]]/g, '');
    const wrappedVerse = `<span class="verse-num">${verseNumber}</span>`;

    return line.replace(verseNumbers[0], wrappedVerse);
  }

  replaceIndents(line) {
    if (line.search("&nbsp;&nbsp;&nbsp;&nbsp;") != -1) {
      line = `<span class="verse-indent">${ line.replace(/&nbsp;/g, "") }</span>`
    }
    return line;
  }

  // Will match even when the key only forms part of the word
  // i.e. 'walk' will match 'walk' and 'walks'
  addEmojis(line) {
    // First do 'light' and 'hear', as they match other words
    var regex = new RegExp(`(\\s|\\W)light[^ \\n]*`,"gi");
    line = line.replace(regex, function (match) {
      if (match.includes("lightning")) return `${match} ⚡`;
      return `${match} 💡`;
    });

    regex = new RegExp(`(\\s|\\W)hear[^ \\n]*`,"gi");
    line = line.replace(regex, function (match) {
      if (match.includes("heart")) return `${match} 💛`;
      return `${match} 👂`;
    });

    regex = new RegExp(`(\\s|\\W)holy( spirit)?[^ \\n]*`,"gi");
    line = line.replace(regex, function (match) {
      if (match.includes("Spirit")) return `${match} 🕊`;
      return `${match} 😇`;
    });

    // only match lower-case spirit - not Holy Spirit
    regex = new RegExp(`(\\s|\\W)spirit[^ \\n]*`,"g");
    line = line.replace(regex, function (match) {
      return `${match} 👻`;
    });

    const keys = Object.keys(EmojiMap);
    for (const k of keys) {
      regex = new RegExp(`(\\s|\\W)${k}[^ \\n]*`,"gi");
      line = line.replace(regex, function (match) {
        return `${match} ${EmojiMap[k]}`;
      });
    }
    return line;
  }

  splitVerse(verse) {
    var poeticLines = verse
      .split(/#/)
      .filter((part) => part !== undefined && part.trim() !== '');
    if (poeticLines.length > 1) {
      this.parts = this.parts.concat(poeticLines);
      return;
    }

    verse = verse.replace(/#/, " ");

    if (verse.length < 20) {
      this.parts.push(verse);
      return;
    }

    var words = verse.split(/ /);
    this.currentPhrase = "";

    if (verse.search(/[.?!"”'\),;:-]/) == -1) {
      if (words.length < 16) {
        this.parts.push(verse);
        return;
      }

      // Divide the verse in 2
      for (var i = 0; i < words.length; i++) {
        this.currentPhrase += words[i] + " ";
        if (i == words.length / 2) {
          this.parts.push(this.currentPhrase);
          this.currentPhrase = "";
        }
      }
      this.parts.push(this.currentPhrase);
      this.currentPhrase = "";
      return;
    }

    var index = this.forwardUntilPunctuation(words, 0);

    do {
      if (this.currentPhrase.trim().length != 0) {
        this.parts.push(this.currentPhrase);
        this.currentPhrase = "";
      }
      index = this.forwardUntilPunctuation(words, index + 1);
    } while (index < words.length - 1);

    if (this.currentPhrase.length < 15) {
      // last phrase is small, so add it onto previous one
      this.currentPhrase = this.parts.pop() + "" + this.currentPhrase;
    }

    this.parts.push(this.currentPhrase);
  }

  // Collects words into currentPhrase until a punctuation mark is reached
  // Returns the index reached
  forwardUntilPunctuation(words, index) {
    for (var i = index; i < words.length; i++) {
      var word = words[i];
      if (i == words.length - 1) {
        this.currentPhrase += word;
        return i;
      }
      this.currentPhrase += word + " ";

      if (word.length < 2) continue;
      var c = word.charAt(word.length - 1);
      switch (c) {
        case '.':
        case '?':
        case '!':
        case '"':
        case '”':
        case '\'':
          return i;
        case ')':
        case ',':
        case ';':
        case ':':
        case '-':
          if (i - index > 2) return i;
      }
    }

    return words.length - 1;
  }

  ionViewDidLoad() {
  }

  onClickFAB = () => {
    this.onShowPart();
  }

  onClickText(event) {
    if (this.settings.leftHanded) {
      if (event.offsetX/this.platform.width() < 0.8) {
        this.onShowPart();
      }
      else {
        this.onGoBack();
      }
    }
    else {
      if (event.offsetX/this.platform.width() > 0.2) {
        this.onShowPart();
      }
      else {
        this.onGoBack();
      }
    }
  }

  onShowPart = () => {
    if (this.counter >= this.parts.length) {
      return;
    }

    this.counter++;
    this.shown = this.parts.slice(0, this.counter);
    this.getNextPhrase();
    this.scrollDown();
    if (this.counter >= this.parts.length) {
      this.finishPassage();
    }
  }

  onShowVerse = () => {
    if (this.counter >= this.parts.length) {
      return;
    }

    do {
      this.counter++;
      this.shown = this.parts.slice(0, this.counter);
      if (this.counter >= this.parts.length) {
        this.finishPassage();
        break;
      }
    } while(this.parts[this.counter].search(/<span class=/) == -1);

    this.scrollDown();
  }

  onShowAll = () => {
    this.counter = this.parts.length;
    this.shown = this.parts;
    this.finishPassage();
    this.scrollDown();
  }

  scrollDown() {
    // The storage.get is a hack - we just need some delay before scrolling to bottom.
    // If you call this.content.scrollToBottom straight away, the page hasn't rendered yet, so it doesn't scroll all the way down
    this.storage.get(this.reference).then(() => {
      this.content.scrollToBottom(400);
    });
  }

  finishPassage() {
    // store this information locally in case the user has moved to a new passage
    var folderToUpdate = this.folder;
    var passagesInFolderToUpdate = this.passagesInFolder;
    var indexInFolderToUpdate = this.indexInFolder;
    this.endOfPassage = true;

    // Mark passage as read
    this.events.publish(
      'passageRead',
      {
        folder: folderToUpdate,
        passagesInFolder: passagesInFolderToUpdate,
        indexInFolder: indexInFolderToUpdate
      }
    );
  }

  onGoBack = () => {
    if (this.counter <= 0) {
      return;
    }

    this.counter--;
    this.shown = this.parts.slice(0, this.counter);
    this.getNextPhrase();
    this.endOfPassage = false;
  }

  onHideAll = () => {
    this.shown = [];
    this.counter = 0;
    this.endOfPassage = false;
  }

  swipeRightEvent() {
    if (this.previousPassageExists) {
      this.ionViewWillLeave();
      this.onHideAll();
      this.indexInFolder--;
      this.fetchPassage();
    }
  }

  swipeLeftEvent() {
    if (this.nextPassageExists) {
      this.ionViewWillLeave();
      this.onHideAll();
      this.indexInFolder++;
      this.fetchPassage();
    }
  }

  onPrevious = () => {
    this.onHideAll();
    this.indexInFolder--;
    this.fetchPassage();
  }

  onNext = () => {
    this.onHideAll();
    this.indexInFolder++;
    this.fetchPassage();
  }

  touchStart(event) {
    if (!this.passageAudio) { return }
    if (this.passageAudio.paused) { return }

    // The timeout delay allows us to wait and see if it is just a click
    this.willPause = true;
    setTimeout(() => {
      this._ngZone.run(() => {
        if (!this.willPause) { return }
        this.passageAudio.pause();
        this.playPauseIcon = 'play';
        if (this.platform.is('android')) {
          //this.musicControls.updateIsPlaying(false);
        }
      });
    }, 200);
  }

  touchEnd(event) {
    if (this.willPause) {
      this.willPause = false;
      if (this.passageAudio && this.passageAudio.paused) {
        this.passageAudio.play();
        this.playPauseIcon = 'pause';
        if (this.platform.is('android')) {
          //this.musicControls.updateIsPlaying(true);
        }
      }
    }
  }

  onAudioToggle = () => {
    if (this.reference == 'Psalm 150:150') {
      let toast = this.toastCtrl.create({
        message: 'Cannot fetch audio for this passage',
        duration: 1000,
        position: 'bottom'
      });
      toast.present();
      return;
    }

    if (!this.passageAudio) {
      const progressCircle = <HTMLElement>document.querySelector('.btnPlayPause__icon');
      progressCircle.style.setProperty('--progress', '0deg');
      this.passageReceived = false;
      const passageUrl = `https://api.esv.org/v3/passage/audio/?q=${ this.reference.replace(/\s/g, '+')}`;
      this.http.get(passageUrl, {}, {'Authorization': ENV.esvApiKey})
        .then(response => {
          this.passageReceived = true;
          console.log(response.status);
          console.log(response.headers);
          console.log(response.url);
          this.passageAudio = new Audio(response.url);
          this.passageAudio.play();
          this.playPauseIcon = 'pause';

          this.passageAudio.addEventListener('ended', () => {
            progressCircle.style.setProperty('--progress', '0deg');
            if (this.settings.audioContinuation) {
              if (this.nextPassageExists) {
                this.swipeLeftEvent();
                this.onAudioToggle();
              } else {
                this.playPauseIcon = 'play';
              }
            } else {
              // Repeat the audio file
              this.passageAudio.play();
            }
          }, false);

          this.passageAudio.addEventListener('timeupdate', function() {
            let progressDegrees = (this.currentTime/this.duration) * 360;
            progressCircle.style.setProperty('--progress', `${progressDegrees}deg`);
          }, false);

          if (this.platform.is('android')) {
            //this.subscribeToMusicControls();
          }
        }).catch(error => { console.log('HTTP error: ' + error); });

      this.indicateDownloading(0);
    } else {
      if (this.passageAudio.paused) {
        this.passageAudio.play();
        this.playPauseIcon = 'pause';
        if (this.platform.is('android')) {
          //this.musicControls.updateIsPlaying(true);
        }
      } else {
        this.passageAudio.pause();
        this.playPauseIcon = 'play';
        if (this.platform.is('android')) {
          //this.musicControls.updateIsPlaying(false);
        }
      }
    }
  }

  indicateDownloading(waitingProgress) {
    const progressCircle = <HTMLElement>document.querySelector('.btnPlayPause__icon');
    setTimeout(() => {
      this._ngZone.run(() => {
        if (this.passageReceived) {
          progressCircle.style.setProperty('--progress', '0deg');
        } else {
          waitingProgress = waitingProgress + 5
          if (waitingProgress > 360) {
            waitingProgress = 0;
          }
          progressCircle.style.setProperty('--progress', `${waitingProgress}deg`);
          this.indicateDownloading(waitingProgress)
        }
      });
    }, 50);
  }

  subscribeToMusicControls() {
    if (!this.platform.is('android')) return;

    this.musicControls.destroy();
    this.musicControls.create({
      track       : this.reference,           // optional, default : ''
      artist      : '',                       // optional, default : ''
      isPlaying   : true,                     // optional, default : true
      dismissable : true,                     // optional, default : false
      cover       : 'assets/imgs/logo.png',   // optional, default : nothing

      // previous/next/close buttons:
      hasPrev   : this.previousPassageExists, // show previous button, optional, default: true
      hasNext   : this.nextPassageExists,     // show next button, optional, default: true
      hasClose  : true,                       // show close button, optional, default: false

      // iOS only
      album: '',                            // optional, default: ''
      duration: this.passageAudio.duration, // optional, default: 0
      elapsed: 0,                           // optional, default: 0
      hasSkipForward: true,                 // show skip forward button, optional, default: false
      hasSkipBackward: true,                // show skip backward button, optional, default: false
      skipForwardInterval: 10,              // display number for skip forward, optional, default: 0
      skipBackwardInterval: 10,             // display number for skip backward, optional, default: 0

      // Android only
      // text displayed in the status bar when the notification (and the ticker) are updated, optional
      ticker: 'Now playing ' + this.reference,
    });

    this.musicControls.subscribe().subscribe((action) => {
      this._ngZone.run(() => { // ensures the UI is updated
        const message = JSON.parse(action).message;
        switch (message) {
          case 'music-controls-media-button-next' :
          case 'music-controls-next':
            this.finishPassage(); // mark as read when user moves forward
            if (this.nextPassageExists) {
              this.swipeLeftEvent();
              this.onAudioToggle();
            }
            break;
          case 'music-controls-media-button-previous' :
          case 'music-controls-previous':
            if (this.passageAudio.currentTime < 3 && this.previousPassageExists) {
              this.swipeRightEvent();
              this.onAudioToggle();
            }
            else {
              this.passageAudio.currentTime = 0
            }
            break;
          case 'music-controls-destroy':
            this.passageAudio.pause();
            this.playPauseIcon = 'play';
            this.musicControls.updateIsPlaying(false);
            break;

          case 'music-controls-media-button-pause' :
            if (this.passageAudio.currentTime < 6) {
              this.passageAudio.currentTime = 0;
            }
            else {
              this.passageAudio.currentTime -= 5;
            }
          case 'music-controls-pause':
          case 'music-controls-media-button-play' :
          case 'music-controls-play':
          case 'music-controls-media-button-play-pause' :
          case 'music-controls-play-pause' :

          // External controls (iOS only)
          case 'music-controls-toggle-play-pause' : // TODO - test this on iOS
            if (this.passageAudio.paused) {
              this.passageAudio.play();
              this.playPauseIcon = 'pause';
              this.musicControls.updateIsPlaying(true);
            } else {
              this.passageAudio.pause();
              this.playPauseIcon = 'play';
              this.musicControls.updateIsPlaying(false);
            }
            break;
          case 'music-controls-seek-to': // TODO - test this on iOS
            const seekToInSeconds = JSON.parse(action).position;
            this.passageAudio.currentTime = seekToInSeconds;
            break;
          case 'music-controls-skip-forward': // TODO - test this on iOS
            this.passageAudio.currentTime += 10;
            break;
          case 'music-controls-skip-backward': // TODO - test this on iOS
            if (this.passageAudio.currentTime < 11) {
              this.passageAudio.currentTime = 0;
            }
            else {
              this.passageAudio.currentTime -= 10;
            }
            break;

          // Headset events (Android only)
          case 'music-controls-headset-unplugged': // TODO - this doesn't fire
            this.passageAudio.pause();
            this.playPauseIcon = 'play';
            this.musicControls.updateIsPlaying(false);
            break;
          case 'music-controls-headset-plugged':
            break;
          case 'music-controls-media-button':
            break;
          case 'music-controls-stop-listening':
            break;
        }
      });
    });

    this.musicControls.listen();
    this.musicControls.updateIsPlaying(true);
  }

  ionViewWillLeave() {
    if (this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
    if (this.passageAudio && !this.passageAudio.paused) {
      this.passageAudio.pause();
      this.playPauseIcon = 'play';
      if (this.platform.is('android')) {
        //this.musicControls.updateIsPlaying(false);
      }
    }
    if (this.passageAudio) {
      this.passageAudio.currentTime = 0;
      this.passageAudio = null;
      if (this.platform.is('android')) {
        //this.musicControls.destroy();
      }
    }
  }

  registerSpeechRecognition() {
    this.recognition = new _SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.recognition.maxAlternatives = 1;
    //var speechRecognitionList = new _SpeechGrammarList();
    //speechRecognitionList.addFromString(this.passage.replace(/<.*>/g,''), 1);
    var _self = this;

    this.recognition.onresult = (event: any) => {
      if (this.nextPhrase == null) return;
      const transcript = event.results[event.results.length - 1][0].transcript;
      const transcriptWords = transcript.toLowerCase().trim().split(" ");
      for (const word of transcriptWords) {
        if (this.nextPhraseStripped.startsWith(word)) { // Word is matched to start of next phrase
          this.consumeWord(word, "");
        } else if (this.nextPhraseStripped.startsWith(this.nextWord + word) // If the spoken word comes after this.nextWord
          && !this.shown[this.shown.length - 1].includes(word)) // Only skip a word if it not present in the words already spoken
        {
          this.consumeWord(word, this.nextWord);
        }

        if (this.nextPhraseStripped === "") {
          this.onShowPart();
        }
      }
    };

    this.recognition.onend = function (event: any) {
      // Only restart the speech recognition if this.isListening == true
      if (!_self.isListening) return;

      // play nicely with the browser, and never restart anything automatically more than once per second
      var timeSinceLastStart = Date.now() - _self.lastStartedAt;
      _self.autoRestartCount += 1;
      if (_self.autoRestartCount % 10 === 0) {
        console.log("Speech Recognition is repeatedly stopping and starting. See http://is.gd/annyang_restarts for tips.");
      }

      if (timeSinceLastStart < 1000) {
        setTimeout(function () {
          console.log("restarting speech recognition after delay");
          _self.lastStartedAt = Date.now();
          try {
            _self.recognition.start();
          } catch {
            console.log("restarting failed");
          }
        }, 1000 - timeSinceLastStart);
      } else {
        console.log("restarting speech recognition");
        _self.lastStartedAt = Date.now();
        try {
          _self.recognition.start();
        } catch {
          console.log("restarting failed");
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.log(`Error occurred in recognition: ${event.error}`);
    };
  }

  onRecite = () => {
    if (this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      return;
    }

    if (this.counter >= this.parts.length) {
      let toast = this.toastCtrl.create({
        message: 'Already at end of passage',
        duration: 1000,
        position: 'bottom'
      });
      toast.present();
      return;
    }

    this.isListening = true;
    this.getNextPhrase();
    this.lastStartedAt = Date.now();
    try{
      this.recognition.start();
    } catch {
      console.log("Starting speech recognition failed");
      this.isListening = false;
    }
  }

  consumeWord(word, skipped) {
    const newNextPhraseStripped = this.nextPhraseStripped.substring(skipped.length + word.length);

    // Check if the word cuts a word in two, e.g. if word is 'a', and next phrase starts with 'abundantly'
    if (newNextPhraseStripped.length > 0 && !newNextPhraseStripped.startsWith(" ")) return;

    this.nextPhraseStripped = newNextPhraseStripped.trim();
    const indexOfSpace = this.nextPhraseStripped.indexOf(' ');
    if (indexOfSpace >= 0) {
      this.nextWord = this.nextPhraseStripped.substring(0, indexOfSpace + 1);
    }

    var toShow = [];
    // Consume any verse number span at the start of nextPhrase
    if (this.nextPhrase.startsWith('<span class="verse-num">')) {
      const i = this.nextPhrase.indexOf("</span>");
      if (i >= 0) {
        const verseString = this.nextPhrase.substring(0, i + '</span>'.length);
        toShow.push(verseString);
        this.nextPhrase = this.nextPhrase.substring(i + '</span>'.length);
      }
    }

    if (skipped.length > 0) {
      toShow.push(this.searchForPunctuationAndThenWord(skipped, true));
    }
    toShow.push(this.searchForPunctuationAndThenWord(word, false));

    this._ngZone.run(() => {
      this.shown[this.shown.length - 1] = this.shown[this.shown.length - 1] + toShow.join("");
      this.scrollDown();
    });
  }

  searchForPunctuationAndThenWord(word, addWrapper) {
    var result = [];
    var indexOfPunctuation = this.nextPhrase.search(/[^a-zA-Z]/);
    while (indexOfPunctuation == 0) {
      result.push(this.nextPhrase[0]);
      this.nextPhrase = this.nextPhrase.substring(1);
      indexOfPunctuation = this.nextPhrase.search(/[^a-zA-Z]/);
    }

    word = word.trim();
    // Now we will look up what the next word is, in this.nextPhrase
    // This is so we retain all original punctuation and capitalised letters.
    if (this.nextPhrase.toLowerCase().startsWith(word)) {
      word = this.nextPhrase.substring(0, word.length);
      this.nextPhrase = this.nextPhrase.substring(word.length);
    } else if (this.nextPhrase.toLowerCase().replace(/[^a-zA-Z\d\s]*/g,"").startsWith(word)) {
      // There is probably an apostrophe in the word, so search up to the next space
      const i = this.nextPhrase.indexOf(' ');
      word = this.nextPhrase.substring(0, i);
      this.nextPhrase = this.nextPhrase.substring(i);
    } else {
      let toast = this.toastCtrl.create({
        message: "Error: word not found at start of nextPhrase: '" + word + "'",
        duration: 1000,
        position: 'bottom'
      });
      toast.present();
      console.log("*** word: '" + word + "'");
      console.log("*** this.nextPhrase: '" + this.nextPhrase + "'");
      const j = this.nextPhrase.toLowerCase().indexOf(word);
      this.nextPhrase = this.nextPhrase.substring(j + word.length);
      console.log("&&& this.nextPhrase: '" + this.nextPhrase + "'");
    }

    if (addWrapper) {
      // save the new wrapped word string to this.parts, so it is retained in the screen
      var part = this.parts[this.counter];
      var part1 = part.substring(0, part.length - this.nextPhrase.length - word.length);
      var part2 = part.substring(part.length - this.nextPhrase.length);
      word = `<span class="skipped-word">${word}</span>`;
      this.parts[this.counter] = part1 + word + part2
    }

    result.push(word);
    return result.join("");
  }

  getNextPhrase() {
    if (this.isListening && this.parts.length > this.counter) {
      this.shown.push("");
      this.parts[this.counter] = this.removeSkippedWordSpans(this.parts[this.counter]);
      this.nextPhrase = this.parts[this.counter];
      this.nextPhraseStripped = this.nextPhrase
        .toLowerCase()
        .replace(/<span class="verse-num">.*?span>/g,'')
        .replace(/[^a-zA-Z\d\s]*/g,"")
        .trim();
      const indexOfSpace = this.nextPhraseStripped.indexOf(' ');
      if (indexOfSpace >= 0) {
        this.nextWord = this.nextPhraseStripped.substring(0, indexOfSpace + 1);
      }
    }
  }

  removeSkippedWordSpans(phrase) {
    var i = phrase.indexOf('<span class="skipped-word">');
    while (i >= 0) {
      const phrase1 = phrase.substring(0, i);
      const phrase2 = phrase.substring(i + '<span class="skipped-word">'.length);
      phrase = phrase1 + phrase2.replace('</span>', '');
      i = phrase.indexOf('<span class="skipped-word">');
    }
    return phrase;
  }

/*
  POC September 2022 - using cordova speech recognition
  onRecite = () => {
    var initialPrompt = "Speak the phrase; I'll correct you if you go wrong."
    if (this.speechReady) {
      this.startRecognition(initialPrompt, 0);
      return;
    }

    this.speechRecognition.isRecognitionAvailable().then((recognitionAvailable: boolean) => {
      if (!recognitionAvailable) {
        let toast = this.toastCtrl.create({
          message: 'Speech recognition is not available on this device; sorry.',
          duration: 2000,
          position: 'bottom'
        });
        toast.present();
        return;
      }

      this.speechRecognition.hasPermission().then((hasPermission: boolean) => {
        if (!hasPermission) {
          this.speechRecognition.requestPermission().then(() => {
            this.startRecognition(initialPrompt, 0);
          });
        }
        else {
          this.speechReady = true;
          this.startRecognition(initialPrompt, 0);
        }
      });
    });
  }

  startRecognition(prompt, retryCount) {
    this.speechRecognition.startListening({ matches: 12, prompt: prompt })
      .subscribe(
      (matches: Array<string>) => {
        if (this.counter >= this.parts.length) {
          let toast = this.toastCtrl.create({
            message: "You've reached the end of the passage.",
            duration: 2000,
            position: 'bottom'
          });
          toast.present();
          return;
        }

        if (this.nextPhrase === "") this.nextPhrase = this.parts[this.counter]
          .toLowerCase()
          .replace(/<.*?>/g,'')
          //.replace(/\[[0-9]+\] /g,'')
          //.replace(/  /g,' ')
          //.replace(/&nbsp;/g,'')
          //.replace(/[.,'"\/#!$%\^&\*;:{}=\-_`~()]/g,"")
          .replace(/[^a-zA-Z\d\s]* /g,"")
          .trim();
        var matched = "";
        matches.forEach((match) => {
          if (matched !== "") return;
          match = match.toLowerCase().trim();
          if (match === this.nextPhrase) {
            matched = match;
            this.nextPhrase = "";
            this.onShowPart();
          }
          if (this.nextPhrase.startsWith(match)) {
            this.nextPhrase = this.nextPhrase.substring(match.length);

            // Need to check if the match cuts a word in two, e.g. if match has 'know', and the next phrase is 'known'
            if (!this.nextPhrase.startsWith(" ")) {
              var len = this.nextPhrase.indexOf(" ")
              if (len <= 2) {
                match = match + this.nextPhrase.substring(0, len)
                this.nextPhrase = this.nextPhrase.substring(len);
              }
            }
            this.nextPhrase = this.nextPhrase.trim();
            matched = match;
            this.shown.push(match);
            this.scrollDown();
          }
        });
        if (matched === "") {
          if (retryCount > 1) { // prompt the user verbally
            var words = this.nextPhrase.split(/ /)
            var help = ""
            if (words.length > 2) help = words[0] + " " + words[1] + " " + words[2];
            else help = "" + this.nextPhrase;
            let toast = this.toastCtrl.create({
              message: help,
              duration: 2000,
              position: 'bottom'
            });
            toast.present();
            this.tts.speak(help)
              .then(() => this.startRecognition("Try again", retryCount + 1))
              .catch((reason: any) => console.log(reason));
            return;
          }
          this.startRecognition("Try again", retryCount + 1);
        }
        else this.startRecognition(matched + "...", 0);
      },
      (onerror) => {
        if (onerror == "0") return // dialog cancelled by user
        let toast = this.toastCtrl.create({
          message: 'error: ' + onerror,
          duration: 2000,
          position: 'bottom'
        });
        toast.present();
      }
    );
  }
*/
  showESVCopyright() {
    let alert = this.alertCtrl.create();
    alert.setTitle('ESV');
    alert.setMessage('Scripture quotations marked “ESV” are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.');
    alert.addButton('Ok');
    alert.present();
  }
}

