import { Component } from '@angular/core';
import { ActionSheetController, Events, IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { Storage } from "@ionic/storage";
import moment from 'moment';
import * as SuggestedPassages from './suggested-passages';

/**
 * Generated class for the SuggestionsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-suggestions',
  templateUrl: 'suggestions.html',
})
export class SuggestionsPage {

  topic;
  passages;
  verses;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private storage: Storage,
              public events: Events,
              private actionSheetCtrl: ActionSheetController,
              private toastCtrl: ToastController) {
  }

  updateTopic() {
    console.log("topic " + this.topic);
    if (this.topic == "Salvation") this.passages = SuggestedPassages.salvation;
    else if (this.topic == "Grace") this.passages = SuggestedPassages.grace;
    else if (this.topic == "Confession") this.passages = SuggestedPassages.confession;
    else if (this.topic == "Suffering") this.passages = SuggestedPassages.suffering;
    else if (this.topic == "Purity") this.passages = SuggestedPassages.purity;
    else if (this.topic == "Adoption") this.passages = SuggestedPassages.adoption;
    else if (this.topic == "Trusting God") this.passages = SuggestedPassages.trustingGod;
    else if (this.topic == "The Greatness of God") this.passages = SuggestedPassages.theGreatnessOfGod;
    else if (this.topic == "The Kindness of God") this.passages = SuggestedPassages.theKindnessOfGod;
    else if (this.topic == "Preservation") this.passages = SuggestedPassages.preservation;
    else if (this.topic == "Evangelism") this.passages = SuggestedPassages.evangelism;
    else if (this.topic == "Eternal Life") this.passages = SuggestedPassages.eternalLife;
    else if (this.topic == "New Creation") this.passages = SuggestedPassages.newCreation;
    else if (this.topic == "Satisfaction") this.passages = SuggestedPassages.satisfaction;
    else if (this.topic == "Family") this.passages = SuggestedPassages.family;
    else if (this.topic == "Money") this.passages = SuggestedPassages.money;
  }

  selectPassage = (passage) => {
    const actionSheet = this.actionSheetCtrl.create({
      title: passage.reference,
      subTitle: passage.text,
      cssClass: 'as-suggestions',
      buttons: [
        {
          text: 'Add to my list',
          icon: 'add',
          handler: () => {
            this.storage.get(passage.reference).then((passage2) => {
              // First check if passage is added already, or is a folder name
              if (passage2 != null) {
                let toast = this.toastCtrl.create({
                  message: passage.reference + ' already added',
                  duration: 2000,
                  position: 'bottom'
                });
                toast.present();
                return;
              }

              this.storage.get("Top Level Folder").then((folder) => {
                if (folder == null) {
                  folder = [];
                }

                folder.push({ reference: passage.reference, date: moment().format("MMM Do"), timestamp: moment.now() });
                this.storage.set("Top Level Folder", folder);
                var textToStore = passage.text
                  .replace(/  /g, '&nbsp;&nbsp;')
                  .replace(/\n/g, '#');
                this.storage.set(passage.reference, textToStore).then( () => {
                  this.events.publish('passagesChanged');
                  let toast = this.toastCtrl.create({
                    message: passage.reference + ' added successfully',
                    duration: 2000,
                    position: 'bottom'
                  });
                  toast.present();
                });
              });
            });
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          icon: 'close',
        }
      ]
    });
    actionSheet.present();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SuggestionsPage');
  }
}
