import { Component } from '@angular/core';
import { AlertController, IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from "@ionic/storage";
// import { Network } from "@ionic-native/network";
import { SocialSharing } from "@ionic-native/social-sharing";
import { Events } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { ENV } from '../../environments/environment';
import moment from 'moment';
import { bookChapters } from './bookChapters';
import * as SuggestedPassages from './suggested-passages';

@IonicPage()
@Component({
  selector: 'page-add-passage',
  templateUrl: 'add-passage.html',
})
export class AddPassagePage {

  reference = "";
  originalPassage = "";
  passage = "";
  formattedPassage = "";
  book;
  bookSelectOptions;
  folder;
  folders;
  chapter = "";
  startVerse = "";
  endVerse = "";
  bookChapters = bookChapters;
  objectKeys = Object.keys;
  loadingToast;
  topics;
  selectedTopic;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private storage: Storage,
              public events: Events,
              private toastCtrl: ToastController,
              public alertCtrl: AlertController,
              private socialSharing: SocialSharing,
              // private network: Network
              ) {
    this.folder = this.navParams.data.folder;
    if (!this.folder) {
      this.folder = "Top Level Folder";
    }
    if (this.navParams.data.reference) {
      this.reference = this.navParams.data.reference;
      var words = this.reference.split(" ");
      var chapterAndVerse = words[words.length - 1];
      this.book = this.reference.replace(" " + chapterAndVerse, "");
      var chapterAndVerseNumber = chapterAndVerse.split(":");
      this.chapter = chapterAndVerseNumber[0];
      this.startVerse = chapterAndVerseNumber[1];
    }
    else {
      this.book = "Psalm";
    }

    this.bookSelectOptions = {title: 'Book'};
    this.storage.get("folders").then((folders) => {
      if (folders == null) {
        folders = [];
      }
      var folderNames = folders.map( (folder) => { return folder.reference; })
      this.folders = ["Top Level Folder"].concat(folderNames);
    });

    this.topics = SuggestedPassages.topics;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AddPassagePage');
  }

  getPassage() {
    // if (!this.network.type || this.network.type == 'unknown' || this.network.type == 'none') {
    //   let toast = this.toastCtrl.create({
    //     message: 'Please enable a data connection to get passage',
    //     duration: 2000,
    //     position: 'bottom'
    //   });
    //   toast.present();
    // }
    // else

    if (!this.book) {
      let toast = this.toastCtrl.create({
        message: 'Please select a book',
        duration: 2000,
        position: 'bottom'
      });
      toast.present();
    }
    else if (!this.chapter) {
      let toast = this.toastCtrl.create({
        message: 'Please select a chapter',
        duration: 2000,
        position: 'bottom'
      });
      toast.present();
    }
    else if (parseInt(this.chapter) > bookChapters[this.book]) {
      let toast = this.toastCtrl.create({
        message: 'There are only ' + bookChapters[this.book] + ' chapters in ' + this.book,
        duration: 2000,
        position: 'bottom'
      });
      toast.present();
    }
    else if (this.startVerse && this.endVerse && parseInt(this.endVerse, 10) < parseInt(this.startVerse,10)) {
      let toast = this.toastCtrl.create({
        message: 'End verse cannot be before start verse',
        duration: 2000,
        position: 'bottom'
      });
      toast.present();
    }
    else if (parseInt(this.chapter) < 1 || (this.startVerse && parseInt(this.startVerse,10) < 1) || (this.endVerse && parseInt(this.endVerse,10) < 1)) {
      let toast = this.toastCtrl.create({
        message: 'Cannot have negative numbers',
        duration: 2000,
        position: 'bottom'
      });
      toast.present();
    }
    else if (this.chapter.charAt(0) == '0') {
      let toast = this.toastCtrl.create({
        message: 'Chapter should not start with "0"',
        duration: 2000,
        position: 'bottom'
      });
      toast.present();
    }
    else {
      if (!this.startVerse) {
        this.reference = this.book + " " + this.chapter;
        if (
          this.reference.startsWith("Obadiah") ||
          this.reference.startsWith("Philemon") ||
          this.reference.startsWith("Jude") ||
          this.reference.startsWith("2 John") ||
          this.reference.startsWith("3 John")) {
          this.startVerse = '1';
          this.endVerse = '100';
          this.reference += ":1-100";
        }
      }
      else if (!this.endVerse || this.endVerse === this.startVerse) {
        this.reference = this.book + " " + this.chapter + ":" + this.startVerse;
      }
      else {
        this.reference = this.book + " " + this.chapter + ":" + this.startVerse + "-" + this.endVerse;
      }

      this.loadingToast = this.toastCtrl.create({
        message: 'Looking up passage…',
        position: 'bottom'
      });
      this.loadingToast.present();

      this.sendRequest();
    }
  }

  correctFormatting(rawPassage, showAlert) {
    this.passage = rawPassage
      .replace(/  /g, '&nbsp;&nbsp;')
      .replace(/\n/g, '#');
    this.formattedPassage = this.passage
      .replace(/#/g, '<br/>');
    this.storage.get("stored_settings").then((settings) => {
      if (settings.replaceTheLORDwithYHWH) {
        this.formattedPassage = this.formattedPassage.replace(/(([Tt]he |)LORD)|GOD/g, "YHWH");
      }
      if (showAlert) {
        this.showAlertToAddPassage();
      }
    });
  }

  sendRequest() {
    var URL = "https://api.esv.org/v3/passage/text/?q=" + this.reference + "&include-passage-references=false&include-first-verse-numbers=true&include-verse-numbers=true&include-footnotes=false&include-footnote-body=false&include-short-copyright=false&include-copyright=false&include-passage-horizontal-lines=false&include-heading-horizontal-lines=false&include-headings=false&include-selahs=true&indent-using=space&indent-paragraphs=0&indent-poetry=true&indent-poetry-lines=4&indent-declares=4&indent-psalm-doxology=30&line-length=0";
    if (this.reference == 'Psalm 150:150') {
      URL = "https://api.esv.org/v3/passage/text/?q=Psalm1:1;Psalm2:1;Psalm3:1;Psalm4:1;Psalm5:1;Psalm6:1;Psalm7:1;Psalm8:1;Psalm9:1;Psalm10:1;Psalm11:1;Psalm12:1;Psalm13:1;Psalm14:1;Psalm15:1;Psalm16:1;Psalm17:1;Psalm18:1;Psalm19:1;Psalm20:1;Psalm21:1;Psalm22:1;Psalm23:1;Psalm24:1;Psalm25:1;Psalm26:1;Psalm27:1;Psalm28:1;Psalm29:1;Psalm30:1;Psalm31:1;Psalm32:1;Psalm33:1;Psalm34:1;Psalm35:1;Psalm36:1;Psalm37:1;Psalm38:1;Psalm39:1;Psalm40:1;Psalm41:1;Psalm42:1;Psalm43:1;Psalm44:1;Psalm45:1;Psalm46:1;Psalm47:1;Psalm48:1;Psalm49:1;Psalm50:1;Psalm51:1;Psalm52:1;Psalm53:1;Psalm54:1;Psalm55:1;Psalm56:1;Psalm57:1;Psalm58:1;Psalm59:1;Psalm60:1;Psalm61:1;Psalm62:1;Psalm63:1;Psalm64:1;Psalm65:1;Psalm66:1;Psalm67:1;Psalm68:1;Psalm69:1;Psalm70:1;Psalm71:1;Psalm72:1;Psalm73:1;Psalm74:1;Psalm75:1;Psalm76:1;Psalm77:1;Psalm78:1;Psalm79:1;Psalm80:1;Psalm81:1;Psalm82:1;Psalm83:1;Psalm84:1;Psalm85:1;Psalm86:1;Psalm87:1;Psalm88:1;Psalm89:1;Psalm90:1;Psalm91:1;Psalm92:1;Psalm93:1;Psalm94:1;Psalm95:1;Psalm96:1;Psalm97:1;Psalm98:1;Psalm99:1;Psalm100:1;Psalm101:1;Psalm102:1;Psalm103:1;Psalm104:1;Psalm105:1;Psalm106:1;Psalm107:1;Psalm108:1;Psalm109:1;Psalm110:1;Psalm111:1;Psalm112:1;Psalm113:1;Psalm114:1;Psalm115:1;Psalm116:1;Psalm117:1;Psalm118:1;Psalm119:1;Psalm120:1;Psalm121:1;Psalm122:1;Psalm123:1;Psalm124:1;Psalm125:1;Psalm126:1;Psalm127:1;Psalm128:1;Psalm129:1;Psalm130:1;Psalm131:1;Psalm132:1;Psalm133:1;Psalm134:1;Psalm135:1;Psalm136:1;Psalm137:1;Psalm138:1;Psalm139:1;Psalm140:1;Psalm141:1;Psalm142:1;Psalm143:1;Psalm144:1;Psalm145:1;Psalm146:1;Psalm147:1;Psalm148:1;Psalm149:1;Psalm150:1&include-passage-references=false&include-first-verse-numbers=true&include-verse-numbers=true&include-footnotes=false&include-footnote-body=false&include-short-copyright=false&include-copyright=false&include-passage-horizontal-lines=false&include-heading-horizontal-lines=false&include-headings=false&include-selahs=true&indent-using=space&indent-paragraphs=0&indent-poetry=true&indent-poetry-lines=4&indent-declares=4&indent-psalm-doxology=30&line-length=0";
    }
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = (function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        var jsonResponse = JSON.parse(xmlHttp.responseText);
        this.originalPassage = jsonResponse["passages"][0];

        if (this.reference == 'Psalm 150:150') {
          this.originalPassage = ''
          for (var index in jsonResponse["passages"]) {
            var verseNumber = Number(index) + 1
            var formattedVerse = '[' + verseNumber + '] ' + jsonResponse["passages"][index].replace('    [1] ','')
            this.originalPassage += formattedVerse
          }
        }

        if (this.book == "Psalm" && this.originalPassage.trim().charAt(0) != '[') {
          this.originalPassage = this.originalPassage.replace('[1]', '\n[1]')
        }
        this.originalPassage = this.originalPassage
          .replace(/\n *\n/g, '\n')
          .replace(/\n *\n/g, '\n')
          .replace(/\n    /g, '\n')
          .replace(/^ +/g, '');
        this.correctFormatting(this.originalPassage, false);

        // check if specified verse is off the end of the passage
        if (this.startVerse && this.reference != 'Psalm 150:150') {
          var startVerseNumber = this.formattedPassage.substring(this.formattedPassage.indexOf('[') + 1, this.formattedPassage.indexOf(']'));
          if (this.startVerse !== startVerseNumber) {
            this.startVerse = startVerseNumber;
            if (this.endVerse) {
              this.reference = this.book + " " + this.chapter + ":" + this.startVerse + "-" + this.endVerse;
            }
            else {
              this.reference = this.book + " " + this.chapter + ":" + this.startVerse;
            }
          }
        }
        if (this.startVerse && this.endVerse) {
          var verses = this.formattedPassage.split('[');
          var lastVerse = verses[verses.length - 1];
          var lastVerseNumber = lastVerse.substring(0, lastVerse.indexOf(']'));
          if (this.endVerse !== lastVerseNumber) {
            this.endVerse = lastVerseNumber;
            if (this.startVerse == '1') { // whole chapter is selected
              this.reference = this.book + " " + this.chapter;
              this.startVerse = '';
              this.endVerse = '';
            }
            else {
              this.reference = this.book + " " + this.chapter + ":" + this.startVerse + "-" + this.endVerse;
            }
          }

          if (this.startVerse && this.startVerse == this.endVerse) {
            this.reference = this.book + " " + this.chapter + ":" + this.startVerse
          }
        }

        if (this.passage) {
          this.loadingToast.dismiss();
          this.showAlertToAddPassage();
        }
      }
    }).bind(this);
    xmlHttp.open( "GET", URL, true );
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader('Authorization', ENV.esvApiKey);
    xmlHttp.send( null );
  }

  share() {
    if (!this.originalPassage || !this.reference) {
      let toast = this.toastCtrl.create({
        message: 'Please get the passage first',
        duration: 2000,
        position: 'bottom'
      });
      toast.present();
      return;
    }

    this.socialSharing.share(this.reference + ' ' + this.originalPassage, this.reference);
  }

  showAlertToAddPassage() {
    // First check if the reference is added already, or is a folder name
    this.storage.get(this.reference).then((passage) => {
      if (passage != null) {
        let toast = this.toastCtrl.create({
          message: this.reference + ' already added',
          duration: 2000,
          position: 'bottom'
        });
        toast.present();
        return;
      }

      let alert = this.alertCtrl.create({
        title: this.reference,
        message: this.formattedPassage,
        buttons: [
          {
            text: 'Add to my list',
            handler: () => {
              if (this.folders.length < 2) {
                this.addPassage("Top Level Folder");
                return;
              }

              let folderChooser = this.alertCtrl.create();
              folderChooser.setTitle('Pick Folder');
              this.folders.forEach((item) => {
                folderChooser.addInput({
                  type: 'radio',
                  label: item,
                  value: item,
                  checked: item === this.folder // by default, select the folder the user was in
                });
              });
              folderChooser.addButton({
                text: 'Ok',
                handler: (destinationFolderName: any) => {
                  if (destinationFolderName) this.addPassage(destinationFolderName);
                }
              });
              folderChooser.addButton({
                text: 'Cancel',
                role: 'cancel'
              });
              folderChooser.present();
            }
          }, {
            text: 'Cancel',
            role: 'cancel'
          }
        ]
      });
      alert.present();
    });
  }

  addPassage(destinationFolderName) {
    this.storage.get(destinationFolderName).then((folder) => {
      if (folder == null) {
        folder = [];
      }

      folder.push({ reference: this.reference, date: moment().format("MMM Do"), timestamp: moment.now() });
      this.storage.set(destinationFolderName, folder);
      this.storage.set(this.reference, this.passage).then( () => {
        this.events.publish('passagesChanged');
        let toast = this.toastCtrl.create({
          message: this.reference + ' added successfully',
          duration: 2000,
          position: 'bottom'
        });
        toast.present();
      });
    });
  }

  openTopic(topicName) {
    if (this.selectedTopic == topicName) {
      this.selectedTopic = null;
    } else {
      this.selectedTopic = topicName;
    }
  }

  openPassage(passage) {
    this.reference = passage.reference;
    this.correctFormatting(passage.text, true);
  }
}
