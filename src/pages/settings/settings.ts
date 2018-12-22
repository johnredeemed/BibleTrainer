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

  sansforgetica: boolean = false;
  replace: boolean = false;
  ordering: boolean = false;
  deadline;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public events: Events,
              private storage: Storage,
              public alertCtrl: AlertController) {
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
}
