import { BrowserModule } from '@angular/platform-browser';
import { NgModule, LOCALE_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NgxAudioPlayerModule } from 'ngx-audio-player';
import { PickerModule } from '@ctrl/ngx-emoji-mart';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { KeysPipe } from './pipes/keys.pipe';


// MATERIAL MODULES
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDividerModule} from '@angular/material/divider';
import {MatListModule} from '@angular/material/list';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatBadgeModule} from '@angular/material/badge';
import {MatTabsModule} from '@angular/material/tabs';
import {MatChipsModule} from '@angular/material/chips';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

// SERVICES
import { LoginService, TokenCheckService, ApiService, InitService, WhatsappService } from './services/service.index';

// Components
import { WhatsappComponent } from './components/whatsapp/whatsapp.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { LoginComponent } from './shared/login/login.component';
import { LogoutComponent } from './shared/logout/logout.component';
import { ToastrModule } from 'ngx-toastr';
import { ConvListComponent } from './components/whatsapp/conv-list/conv-list.component';
import { OrderModule } from 'ngx-order-pipe';
import { ChatWindowComponent } from './components/whatsapp/chat-window/chat-window.component';
import { WriteMsgComponent } from './components/whatsapp/write-msg/write-msg.component';
import { CloseTicketComponent } from './components/whatsapp/close-ticket/close-ticket.component';
import { InfoClienteComponent } from './components/whatsapp/info-cliente/info-cliente.component';
import { AssignTicketComponent } from './components/whatsapp/assign-ticket/assign-ticket.component';



@NgModule({
  declarations: [
    AppComponent,
    WhatsappComponent,
    NavbarComponent,
    LoginComponent,
    LogoutComponent,
    ConvListComponent,
    ChatWindowComponent,
    KeysPipe,
    WriteMsgComponent,
    CloseTicketComponent,
    InfoClienteComponent,
    AssignTicketComponent

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatDividerModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTabsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ToastrModule.forRoot(),
    CommonModule,
    OrderModule,
    NgxAudioPlayerModule,
    PickerModule,
  ],
  providers: [
    InitService,
    LoginService,
    TokenCheckService,
    ApiService,
    WhatsappService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
