import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AddPassagePage } from './add-passage';

@NgModule({
  declarations: [
    AddPassagePage,
  ],
  imports: [
    IonicPageModule.forChild(AddPassagePage),
  ],
})
export class AddPassagePageModule {}
