import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { Network } from "@ionic-native/network";
import { MusicControls } from '@ionic-native/music-controls';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { SocialSharing } from "@ionic-native/social-sharing";
import { HTTP } from '@ionic-native/http';

import { MyApp } from './app.component';
import { AddPassagePage } from '../pages/add-passage/add-passage';
import { PassageListPage } from '../pages/passage-list/passage-list';
import { MenuPage } from '../pages/menu/menu';
import { RecitePassagePage } from "../pages/recite-passage/recite-passage";
import { SettingsPage } from "../pages/settings/settings";
import { SearchPage } from "../pages/search/search";

@NgModule({
  declarations: [
    MyApp,
    AddPassagePage,
    PassageListPage,
    MenuPage,
    RecitePassagePage,
    SettingsPage,
    SearchPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AddPassagePage,
    PassageListPage,
    MenuPage,
    RecitePassagePage,
    SettingsPage,
    SearchPage
  ],
  providers: [
    Network,
    MusicControls,
    SocialSharing,
    SplashScreen,
    StatusBar,
    HTTP,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
