import { Component, ViewChild } from '@angular/core';
import { Platform, Nav, AlertController, ToastController, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Storage } from "@ionic/storage";
import moment from 'moment';

import { PassageListPage } from '../pages/passage-list/passage-list';
import { SettingsPage } from "../pages/settings/settings";
import { SearchPage } from "../pages/search/search";
import { AddPassagePage } from '../pages/add-passage/add-passage';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) navCtrl: Nav;
    rootPage:any = PassageListPage;

  constructor(private platform: Platform,
              private statusBar: StatusBar,
              private splashScreen: SplashScreen,
              private alertCtrl: AlertController,
              private storage: Storage,
              public events: Events,
              private toastCtrl: ToastController) {
    platform.ready().then(() => {
      //statusBar.backgroundColorByName("white");
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }

  settings = () => {
    this.navCtrl.push(SettingsPage);
  }

  showInfo = () => {
    let alert = this.alertCtrl.create({
      title: 'Info',
      message:
        'Feedback would be gratefully received at bibletrainerapp@gmail.com' +
        '<br/><br/>The home screen will have the list of passages you are memorising. To add passages, click the Add Passage button on the home screen.' +
        '<br/><br/>Then you can choose any passage from the Bible...or pick one from the list of suggested passages.' +
        '<br/><br/>Once you have a passage in your list, you can start to learn it by clicking on it, and in the next screen use the "+" button to reveal the passage bit-by-bit. ' +
        '<br/><br/>Keep practising the passages you\'re memorising to move them into your long-term memory. You have the option to order passages by when they were last read - choose this in the settings page. ' +
        '<br/><br/>You can organise your passages into folders; add a new folder through the menu option and then either ' +
        'move existing passages into the folder (by long-pressing on a passage and choosing "Move to folder"), or add passages directly to the folder with the drop-down menu in the Add Passage screen. ',
      buttons: [
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });
    alert.present();
  }

  addPassage = () => {
    this.navCtrl.push(AddPassagePage);
  }

  search = () => {
    this.navCtrl.push(SearchPage);
  }

  clear = () => {
    let alert = this.alertCtrl.create({
      title: 'Really clear all storage? This will remove all data.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm clear storage',
          role: 'destructive',
          handler: () => {
            this.storage.clear();
            this.events.publish('passagesChanged');
          }
        }
      ]
    });
    alert.present();
  }

  addFolder = () => {
    let alert = this.alertCtrl.create({
      title: 'Enter folder name',
      inputs: [
        {
          name: 'folderName',
          placeholder: ''
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Create',
          handler: data => {
            if (data.folderName === "" || !data.folderName) {
              let toast = this.toastCtrl.create({
                message: 'Cannot accept blank folder name',
                duration: 2000,
                position: 'bottom'
              });
              toast.present();
              return;
            }

            if (data.folderName === "folders" ||
                data.folderName === "Top Level Folder" ||
                data.folderName === "stored_settings") {
              let toast = this.toastCtrl.create({
                message: '\'' + data.folderName + '\' is reserved; please choose another name.',
                duration: 2000,
                position: 'bottom'
              });
              toast.present();
              return;
            }

            this.storage.get(data.folderName).then((folder) => {
              if (folder != null) {
                let toast = this.toastCtrl.create({
                  message: 'Item already exists as a folder or passage.',
                  duration: 2000,
                  position: 'bottom'
                });
                toast.present();
                return;
              }

              this.storage.get("folders").then((folders) => {
                if (folders == null) {
                  folders = [];
                }

                folders.push({ reference: data.folderName, date: moment().format("MMM Do"), timestamp: moment.now() });

                this.storage.get("stored_settings").then((settings) => {
                  if (settings.sortByDate) {
                    folders.sort(this.compareDates.bind(this));
                  }
                  else {
                    folders.sort(this.compareNames.bind(this));
                  }

                  this.storage.set(data.folderName, []);
                  this.storage.set("folders", folders).then( () => {
                    this.events.publish('passagesChanged');
                  });
                });
              });
            });
          }
        }
      ]
    });
    alert.present();
  }

  compareDates(a, b) {
    return a.timestamp - b.timestamp;
  }

  compareNames(a, b) {
    if (a.reference < b.reference) return -1;
    return 1;
  }
}
