import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { WhatsappService } from '../../../services/service.index';

import * as moment from 'moment-timezone';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageModalComponent } from '../image-modal/image-modal.component';
import { Subscription } from 'rxjs';
declare var jQuery: any;
declare var google: any

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit, OnDestroy {

  @ViewChild(ImageModalComponent, {static: false}) _img:ImageModalComponent

  windowHeight = 5
  chatHeight = 660
  param = {value: 'mundo'}
  tr:any
  rTo:any

  constructor( private activatedRoute: ActivatedRoute, public _wa:WhatsappService, public _route:Router) {
    this.activatedRoute.params.subscribe( params => {

        if ( params.tkt ){
          this._wa.reloadChat = true
          this._wa.getConv( params.tkt, true )
        }else{
          this._wa.reloadChat = true
        }

    });

  }

  ngOnInit() {
    this._wa.reloadChat = true
    this._wa.chatMsgs = []

    this.resizeChat()
  }

  resizeChat(){
    if( this.rTo ){
      clearTimeout( this.rTo )
    }

    window.setTimeout( () => {
      this.windowHeight = window.innerHeight -  jQuery('#topMenu').innerHeight() -  jQuery('#bottomBar').innerHeight() - (this._wa.zdesk ? 0 : 0)

      if( this.windowHeight == 0 ){ this.windowHeight = 600 }
      this.chatHeight = window.innerHeight - (this._wa.zdesk ? 0 : 40)
    },1000)
  }

  ngOnDestroy(){
    this._wa.lastUrl = this._route.url
    this._wa.reloadChat = false
    this._wa.chatInfo = {}
    jQuery('.modal').modal('hide')
  }

  formatTime( t, f ){
    if( moment(t) < moment(moment().format('YYYY-MM-DD')) ){
      if( moment(t).format('YYYY-MM-DD') == moment().subtract(1,'days').format('YYYY-MM-DD') ){
        return 'ayer '+moment(t).format(f);
      }else{
        return moment(t).format('DD-MMM '+f)
      }
    }

    return moment(t).format(f)
  }

  scrollBtm(){
    document.getElementById('link').click();
  }

  onScroll( e ){


    let clh = e.target.clientHeight
    let scr = e.target.scrollTop
    let dht = e.target.scrollHeight

    if( (dht - scr - clh) > 15 ){
      console.log( 'Show Bottom Button')
      this._wa.bottomFlag = true
      this._wa.newMsgs = 0
    }else{
      console.log( 'Hide Bottom Button')
      this._wa.bottomFlag = false
    }

    this._wa.scr = dht - scr - clh

    // console.log('clh', 'dht', 'scr')
    // console.log(clh, dht, scr)
    // console.log(dht - scr - clh)

  }

}
