import { AlertController, Events, NavController, NavParams, ToastController, Platform } from 'ionic-angular';
import { Component, NgZone, ViewChild } from '@angular/core';
import { MusicControls } from '@ionic-native/music-controls';
// import { Network } from "@ionic-native/network";
import { Storage } from "@ionic/storage";
import { ENV } from '../../environments/environment';
import { EmojiMap } from './emoji-map';

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
  endOfPassage: boolean = false;
  previousPassageExists;
  nextPassageExists;
  folder;
  passagesInFolder;
  indexInFolder;
  folderObject;
  speechEnabled = false;
  speechReady = false;
  passageAudio = null;
  playPauseIcon: String = 'play';
  repeatIcon = 0;
  settings;
  contentClass = "recite-passage";

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private storage: Storage,
              private platform: Platform,
              public events: Events,
              private toastCtrl: ToastController,
              public alertCtrl: AlertController,
              private musicControls: MusicControls,
              // private network: Network,
              private _ngZone: NgZone) {
    this.storage.get("stored_settings").then((settings) => {
      this.settings = settings;
      if (!this.settings.repeatAudio) {
        this.settings.repeatAudio = 0;
      }

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

  onShowPart = () => {
    if (this.counter >= this.parts.length) {
      return;
    }

    this.counter++;
    this.shown = this.parts.slice(0, this.counter);
    if (this.counter >= this.parts.length) {
      this.finishPassage();
    }

    this.scrollDown();
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
    // store this information locally in case the user has moved to a new passage by the time the toast goes away
    var folderToUpdate = this.folder;
    var passagesInFolderToUpdate = this.passagesInFolder;
    var indexInFolderToUpdate = this.indexInFolder;
    this.endOfPassage = true;
    let toast = this.toastCtrl.create({
      message: `${this.reference} marked as read. May it dwell in you richly!`,
      duration: 4000,
      showCloseButton: true,
      closeButtonText: 'Undo',
      position: 'top',
    });
    toast.onDidDismiss((data, role) => {
      if (role !== "close") {
        this.events.publish('passageRead', { folder : folderToUpdate, passagesInFolder : passagesInFolderToUpdate, indexInFolder : indexInFolderToUpdate });
      }
    });
    toast.present();
  }

  onGoBack = () => {
    if (this.counter <= 0) {
      return;
    }

    this.counter--;
    this.shown = this.parts.slice(0, this.counter);
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

  onRepeatToggle = () => {
    this.settings.repeatAudio++;
    if (this.settings.repeatAudio > 1) {
      this.settings.repeatAudio = 0;
    }

    this.storage.set("stored_settings", this.settings);
    this.repeatIcon = this.settings.repeatAudio;
  }

  onAudioToggle = () => {
    if (!this.passageAudio) {
      const progressBar = <HTMLElement>document.querySelector('.audioPlayer__scrubber__location');
      const passageUrl = `http://www.esvapi.org/v2/rest/passageQuery?key=${ ENV.esvApiKey }&output-format=mp3&passage=${ this.reference.replace(/\s/g, '%20')}`
      this.passageAudio = new Audio(passageUrl);
      this.passageAudio.play();
      this.playPauseIcon = 'pause';
      this.repeatIcon = this.settings.repeatAudio;

      this.passageAudio.addEventListener('ended', () => {
        switch(this.settings.repeatAudio) {
          case 1: // repeat
            this.passageAudio.play();
            break;
          case 2: // continue
            if (this.nextPassageExists) {
              this.swipeLeftEvent();
              this.onAudioToggle();
            }
          default: // stop
            this.playPauseIcon = 'play';
            if (this.platform.is('android')) {
              this.musicControls.updateIsPlaying(false);
            }
        }
      }, false);

      this.passageAudio.addEventListener('timeupdate', function() {
        let progress = (this.currentTime/this.duration) * 100;
        progressBar.style.width = `${progress}%`;
      }, false);

      if (this.platform.is('android')) {
        this.subscribeToMusicControls();
      }
    } else {
      if (this.passageAudio.paused) {
        this.passageAudio.play();
        this.playPauseIcon = 'pause';
        if (this.platform.is('android')) {
          this.musicControls.updateIsPlaying(true);
        }
      } else {
        this.passageAudio.pause();
        this.playPauseIcon = 'play';
        if (this.platform.is('android')) {
          this.musicControls.updateIsPlaying(false);
        }
      }
    }
  }

  subscribeToMusicControls() {
    if (!this.platform.is('android')) { return; }

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
    if (this.passageAudio && !this.passageAudio.paused) {
      this.passageAudio.pause();
      this.playPauseIcon = 'play';
      if (this.platform.is('android')) {
        this.musicControls.updateIsPlaying(false);
      }
    }
    if (this.passageAudio) {
      this.passageAudio.currentTime = 0;
      this.passageAudio = null;
      if (this.platform.is('android')) {
        this.musicControls.destroy();
      }
    }
  }

/*
  onRecite = () => {
    if (this.speechReady) {
      this.startRecognition();
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
            this.startRecognition();
          });
        }
        else {
          this.speechReady = true;
          this.startRecognition();
        }
      });
    });
  }

  startRecognition() {
    this.speechRecognition.startListening({ matches: 8, prompt: "Speak the phrase; I'll correct you if you go wrong." })
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

        this.onShowPart();
        var nextPhrase = this.shown[this.shown.length - 1]
          .toLowerCase()
          .replace(/\[[0-9]+\] /g,'')
          .replace(/  /g,' ')
          .replace(/&nbsp;/g,'')
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
          .trim();
        var matched = false;
        matches.forEach((match) => {
          if (matched) return;
          if (match.toLowerCase() === nextPhrase) {
            let toast = this.toastCtrl.create({
              message: "Correct!",
              duration: 2000,
              position: 'bottom'
            });
            toast.present();
            matched = true;
          }
        });
        if (!matched) {
          let toast = this.toastCtrl.create({
            message: "The phrase we were looking for was '" + nextPhrase + "'",
            duration: 8000,
            position: 'bottom'
          });
          toast.present();
          //this.shown = matches;
          //for debug
        }
      },
      (onerror) => {
        let toast = this.toastCtrl.create({
          message: 'error: ' + onerror,
          duration: 8000,
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
