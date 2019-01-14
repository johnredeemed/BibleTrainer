import { Component } from '@angular/core';
import { AlertController, IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from "@ionic/storage";
import { SocialSharing } from "@ionic-native/social-sharing";
import { Events } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import moment from 'moment';

/**
 * Generated class for the AddPassagePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

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
  bookChapters = {
    "Genesis": 50,
    "Exodus": 40,
    "Leviticus": 27,
    "Numbers": 36,
    "Deuteronomy": 34,
    "Joshua": 24,
    "Judges": 21,
    "Ruth": 4,
    "1 Samuel": 31,
    "2 Samuel": 24,
    "1 Kings": 22,
    "2 Kings": 25,
    "1 Chronicles": 29,
    "2 Chronicles": 36,
    "Ezra": 10,
    "Nehemiah": 13,
    "Esther": 10,
    "Job": 42,
    "Psalm": 150,
    "Proverbs": 31,
    "Ecclesiastes": 12,
    "Song of Solomon": 8,
    "Isaiah": 66,
    "Jeremiah": 52,
    "Lamentations": 5,
    "Ezekiel": 48,
    "Daniel": 12,
    "Hosea": 14,
    "Joel": 3,
    "Amos": 9,
    "Obadiah": 1,
    "Jonah": 4,
    "Micah": 7,
    "Nahum": 3,
    "Habakkuk": 3,
    "Zephaniah": 3,
    "Haggai": 2,
    "Zechariah": 14,
    "Malachi": 4,
    "Matthew": 28,
    "Mark": 16,
    "Luke": 24,
    "John": 21,
    "Acts": 28,
    "Romans": 16,
    "1 Corinthians": 16,
    "2 Corinthians": 13,
    "Galatians": 6,
    "Ephesians": 6,
    "Philippians": 4,
    "Colossians": 4,
    "1 Thessalonians": 5,
    "2 Thessalonians": 3,
    "1 Timothy": 6,
    "2 Timothy": 4,
    "Titus": 3,
    "Philemon": 1,
    "Hebrews": 13,
    "James": 5,
    "1 Peter": 5,
    "2 Peter": 3,
    "1 John": 5,
    "2 John": 1,
    "3 John": 1,
    "Jude": 1,
    "Revelation": 21
  };
  objectKeys = Object.keys;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private storage: Storage,
              public events: Events,
              private toastCtrl: ToastController,
              public alertCtrl: AlertController,
              private socialSharing: SocialSharing) {
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
      this.chapter = "1";
    }

    this.bookSelectOptions = {title: 'Book'};
    this.storage.get("folders").then((folders) => {
      if (folders == null) {
        folders = [];
      }
      var folderNames = folders.map( (folder) => { return folder.reference; })
      this.folders = ["Top Level Folder"].concat(folderNames);
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AddPassagePage');
  }

  getPassage() {
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
    else if (parseInt(this.chapter) > this.bookChapters[this.book]) {
      let toast = this.toastCtrl.create({
        message: 'There are only ' + this.bookChapters[this.book] + ' chapters in ' + this.book,
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
        this.reference = this.book + " " + this.chapter
      }
      else if (!this.endVerse || this.endVerse === this.startVerse) {
        this.reference = this.book + " " + this.chapter + ":" + this.startVerse;
      }
      else {
        this.reference = this.book + " " + this.chapter + ":" + this.startVerse + "-" + this.endVerse;
      }

      this.sendRequest();
    }
  }

  sendRequest() {
    var URL = "https://api.esv.org/v3/passage/text/?q=" + this.reference + "&include-passage-references=false&include-first-verse-numbers=true&include-verse-numbers=true&include-footnotes=false&include-footnote-body=false&include-short-copyright=false&include-copyright=false&include-passage-horizontal-lines=false&include-heading-horizontal-lines=false&include-headings=false&include-selahs=true&indent-using=space&indent-paragraphs=0&indent-poetry=true&indent-poetry-lines=4&indent-declares=4&indent-psalm-doxology=30&line-length=0";
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = (function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        var jsonResponse = JSON.parse(xmlHttp.responseText);
        this.originalPassage = jsonResponse["passages"][0];
        if (this.book == "Psalm" && this.originalPassage.trim().charAt(0) != '[') {
          this.originalPassage = this.originalPassage.replace('[1]', '\n[1]')
        }
        this.originalPassage = this.originalPassage
          .replace(/\n *\n/g, '\n')
          .replace(/\n *\n/g, '\n')
          .replace(/\n    /g, '\n')
          .replace(/^ +/g, '');
        this.passage = this.originalPassage
          .replace(/  /g, '&nbsp;&nbsp;')
          .replace(/\n/g, '#');
        this.formattedPassage = this.passage
          .replace(/#/g, '<br/>');
        this.storage.get("stored_settings").then((settings) => {
          if (settings.replaceTheLORDwithYHWH) {
            this.formattedPassage = this.formattedPassage.replace(/(([Tt]he |)LORD)|GOD/g, "YHWH");
          }
        });

        // check if specified verse is off the end of the passage
        if (this.startVerse) {
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
            this.reference = this.book + " " + this.chapter + ":" + this.startVerse + "-" + this.endVerse;
          }

          if (this.startVerse == this.endVerse) {
            this.reference = this.book + " " + this.chapter + ":" + this.startVerse
          }
        }

        if (this.passage) this.showAlertToAddPassage();
      }
    }).bind(this);
    xmlHttp.open( "GET", URL, true );
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader('Authorization', "Token 332b2b26bf6328da3e8d2b4aaf99155600668fcc");
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
              folderChooser.setTitle('Which folder should this passage be in?');
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
}
