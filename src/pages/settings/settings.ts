import { Component } from '@angular/core';
import { AlertController, Events, IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
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

  sansforgetica: boolean = false;
  replace: boolean = false;
  ordering: boolean = false;
  deadline;
  notification: boolean = false;
  notificationTime;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public events: Events,
              private storage: Storage,
              public alertCtrl: AlertController,
              private toastCtrl: ToastController,
              private localNotifications: LocalNotifications) {
    this.storage.get("useSansForgetica").then((value) => {
      this.sansforgetica = value;
    });
    this.storage.get("replaceTheLORDwithYHWH").then((value) => {
      this.replace = value;
    });
    this.storage.get("sortByDate").then((value) => {
      this.ordering = value;
    });
    this.storage.get("deadline").then((value) => {
      if (value == null) value = "7";
      this.deadline = value;
    });
    this.storage.get("reminderNotification").then((value) => {
      this.notification = value;
    });
    this.storage.get("reminderNotificationTime").then((value) => {
      this.notificationTime = value;
    });
  }

  ionViewDidLoad() {
  }

  changeFont() {
    this.storage.set("useSansForgetica", this.sansforgetica);
  }

  changeReplace() {
    this.storage.set("replaceTheLORDwithYHWH", this.replace);
  }

  changeOrdering() {
    this.storage.set("sortByDate", this.ordering).then( () => {
      this.events.publish('passagesChanged');
    });
  }

  changeDeadline() {
    if (!this.deadline || parseInt(this.deadline) < 0) this.deadline = 7;
    this.storage.set("deadline", this.deadline).then( () => {
      this.events.publish('passagesChanged');
    });
  }

  changeNotification() {
    this.storage.set("reminderNotification", this.notification);
    if (!this.notification) {
      this.localNotifications.clearAll();
    }
    else if (this.notificationTime) {
      this.setNotification();
    }
  }

  changeNotificationTime() {
    this.storage.set("reminderNotificationTime", this.notificationTime);
    this.setNotification();
  }

  setNotification() {
    this.localNotifications.clearAll();
    var timeSplit = this.notificationTime.split(":");
    let notification = {
      id: 1,
      text: 'Let the word of Christ dwell in you richly',
      trigger: { every: { hour: parseInt(timeSplit[0]), minute: parseInt(timeSplit[1]) }, count: 1 }
    };
    this.localNotifications.schedule(notification);
  }
}
