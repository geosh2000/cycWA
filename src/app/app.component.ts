import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { TokenCheckService, WhatsappService } from './services/service.index';
import { Router } from '@angular/router';

declare var jQuery: any;
import * as moment from 'moment-timezone';
import * as Globals from './globals';
import { InfoClienteComponent } from './components/whatsapp/info-cliente/info-cliente.component';
import { AssignTicketComponent } from './components/whatsapp/assign-ticket/assign-ticket.component';
import { WriteMsgComponent } from './components/whatsapp/write-msg/write-msg.component';
import { InitService } from 'src/app/services/init.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {

  @ViewChild('chatColumn', {static: false}) _mainColumn:ElementRef;
  @ViewChild(InfoClienteComponent, {static: false}) _info:InfoClienteComponent
  @ViewChild(AssignTicketComponent, {static: false}) _assign:AssignTicketComponent
  @ViewChild(WriteMsgComponent, {static: false}) _write:WriteMsgComponent

  title = 'cycWA';
  chatSize:any = 200
  resizeTo:any

  constructor( public _init:InitService, public _token:TokenCheckService, public _route:Router, public _wa:WhatsappService) {
    this._wa.zdesk = Globals.ZDESK
  }

  ngOnInit(){}

  ngAfterViewInit(){
    if( this._wa.zdesk ){
      this.resizeChat()
    }
  }

  resizeChat(){
    this.chatSize = this._mainColumn.nativeElement.clientWidth

    if( this.resizeTo ){
      clearTimeout(this.resizeTo)
    }

    window.setTimeout(() => {
      this.resizeChat()
    },1000)
  }

  isList( t ){
    let exp = /app/gm
    return t.match(exp)
  }

  goBottom(){
    let dummyEl = document.getElementById('note');
    let isFocused = (document.activeElement === dummyEl);

    this._wa.scrollBottom()
    if(isFocused){
      jQuery('#note').focus()
    }

    this._wa.newMsgs = 0
  }

  openModal( e ){
    switch(e){
      case 'info':
        this._info.openInfo()
        break
      case 'assign':
        this._assign.openAssign()
        break
    }
  }

}
