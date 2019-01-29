import { Component } from '@angular/core';
import { AlertController, Events, IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from "@ionic/storage";

/**
 * Generated class for the SettingsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  settings;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public events: Events,
              private storage: Storage,
              public alertCtrl: AlertController) {
    this.settings = {};
    this.storage.get("stored_settings").then((settings) => {
      this.settings = settings;
    });
  }

  ionViewDidLoad() {
  }

  updateStoredSettings() {
    this.storage.set("stored_settings", this.settings);
  }

  changeOrdering() {
    this.storage.set("stored_settings", this.settings).then( () => {
      this.events.publish('passagesChanged');
    });
  }

  changeDeadline() {
    if (!this.settings.deadline || parseInt(this.settings.deadline) < 0) this.settings.deadline = 7;
    this.storage.set("stored_settings", this.settings).then( () => {
      this.events.publish('passagesChanged');
    });
  }
}
