import { Component } from '@angular/core';
import { AlertController, Events, IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from "@ionic/storage";
import { LocalNotifications } from "@ionic-native/local-notifications";

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
              public alertCtrl: AlertController,
              private localNotifications: LocalNotifications) {
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

  changeNotification() {
    this.storage.set("stored_settings", this.settings);
    if (!this.settings.reminderNotification) {
      this.localNotifications.clearAll();
    }
    else if (this.settings.reminderNotificationTime) {
      this.setNotification();
    }
  }

  changeNotificationTime() {
    this.storage.set("stored_settings", this.settings);
    this.setNotification();
  }

  setNotification() {
    this.localNotifications.clearAll();
    var timeSplit = this.settings.reminderNotificationTime.split(":");
    let notification = {
      id: 1,
      text: 'Let the word of Christ dwell in you richly',
      trigger: { every: { hour: parseInt(timeSplit[0]), minute: parseInt(timeSplit[1]) }, count: 1 }
    };
    this.localNotifications.schedule(notification);
  }
}
