import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { InitService, ApiService, WhatsappService } from '../../../services/service.index';

import * as moment from 'moment-timezone';
import { ToastrService } from 'ngx-toastr';
import { ChatService } from '../../../services/chat.service';
import { Subscription, Observable } from 'rxjs';
import { WebsocketService } from '../../../services/websocket.service';
declare var jQuery: any;

@Component({
  selector: 'app-conv-list',
  templateUrl: './conv-list.component.html',
  styleUrls: ['./conv-list.component.css']
})
export class ConvListComponent implements OnInit, OnDestroy {

  loading:Object = {}
  selected = ''
  timeout:any
  windowHeight = 500
  resizeTo:any
  dummy = true
  newConvsObs: Subscription

  constructor(
                private activatedRoute: ActivatedRoute,
                public _init:InitService,
                private _route:Router,
                public toastr:ToastrService,
                private _api:ApiService,
                public _wa:WhatsappService,
                public chat: ChatService,
                public ws: WebsocketService
              ) {

    this.activatedRoute.params.subscribe( params => {

        if ( params.id ){
          this._wa.reloadTickets = true
          // this._wa.getTickets( params.id )
        }else{
          this._wa.reloadTickets = true
          // this._wa.getTickets()
        }

    });

  }

  ngOnInit() {
    this._wa.reloadTickets = true
    this._wa.lastUrl = this._route.url

    this.resizeChat()

    this.newConvsObs = this.chat.getNewWhatsapps().subscribe(  msg => {
      // console.log( msg );
      this._wa.indivList( msg['ticket'], msg['data'] )
    });

    this._wa.wsStatusChange().subscribe( status => {
      if ( status ) {
        console.log( 'Socket connected', status)

        this.newConvsObs.unsubscribe();
        this.newConvsObs = this.chat.getNewWhatsapps().subscribe(  msg => {
          // console.log( msg );
          this._wa.indivList( msg['ticket'], msg['data'] )
        });
      }else{
        console.log( 'Socket disconnected', status)
        this.newConvsObs.unsubscribe();
      }
    })

  }

  ngOnDestroy(){
    this._wa.reloadTickets = false

    this.newConvsObs.unsubscribe();
    jQuery('.modal').modal('hide')
  }

  resizeChat(){
    this.windowHeight = window.innerHeight -  jQuery('#topMenu').innerHeight()

    // console.log( window.innerHeight )
    // console.log( jQuery('#topMenu') )

    if( this.resizeTo ){
      clearTimeout(this.resizeTo)
    }

    window.setTimeout(() => {
      this.resizeChat()
    },1000)
  }

  formatTime( t, f ){

    let r
    let tm = moment(t)

    if( tm < moment(moment().format('YYYY-MM-DD')) ){
      if( tm.format('YYYY-MM-DD') == moment().subtract(1,'days').format('YYYY-MM-DD') ){
        r = '<span class="text-danger">' + 'ayer '+tm.format(f) + '</span>'
      }else{
        r = '<span class="text-danger">' + tm.format('DD-MMM '+f) + '</span>'
      }
    }else{
      r = '<span class="text-success">' + tm.format(f) + '</span>'
    }


    return r
  }

  // setConv(id, ag, e){
  //   this.setTicket.emit(id)
  //   this.ticketSelected = id
  //   jQuery('.itemList').removeClass('mOver')
  //   jQuery('#'+id).addClass('mOver')
  //   if( ag == this.agentId){
  //     this.clearNotif(id)
  //   }
  // }

  readTime( t ){
    if( t['readMsg'] == null ){
      return true
    }

    if( moment(t['readMsg']) < moment(t['lastMsg']) ){
      return true
    }

    return false
  }

  mOver( e ){
    jQuery(e.target).addClass('mOver')
  }

  mLeave( e ){
    jQuery(e.target).removeClass('mOver')
  }

  goToChat( t ){
    this._wa.chatInfo = {
      requester: t['reqName'],
      agentName: t['agentName']
    }
    this._wa.lastIsIn = t['lastIsIn']
    this._wa.assignee = t['assignee']

    if( this._wa.zdesk ){
      this._wa.getConv( t['ticketId'], true )
      this.ws.setTicket( t['ticketId'] )
      if( this._wa.ticketObs ){
        this._wa.ticketObs.unsubscribe()
      }
      this._wa.ticketObs = this.chat.notifyNewMsgTicket( t['ticketId'] ).subscribe(
        msg => {
          console.log(msg)
          this._wa.getConv( t['ticketId'] )
        })
    }else{
      this._route.navigate([`/chat/${t['ticketId']}`]);
    }
  }

  waitAlert( t ){
    return moment(t) < moment().subtract(5, 'minutes')
  }
}
