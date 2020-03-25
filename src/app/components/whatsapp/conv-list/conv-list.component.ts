import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { InitService, ApiService, WhatsappService } from '../../../services/service.index';

import * as moment from 'moment-timezone';
import { OrderPipe } from 'ngx-order-pipe';
import { ToastrService } from 'ngx-toastr';
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

  constructor(
                private activatedRoute: ActivatedRoute,
                public _init:InitService,
                private _route:Router,
                public toastr:ToastrService,
                private _api:ApiService,
                public _wa:WhatsappService,
              ) {

    this.activatedRoute.params.subscribe( params => {

        if ( params.id ){
          this._wa.reloadTickets = true
          this._wa.getTickets( params.id )
        }else{
          this._wa.reloadTickets = true
          this._wa.getTickets()
        }

    });

  }

  ngOnInit() {
    this._wa.reloadTickets = true
    this._wa.lastUrl = this._route.url

    this.windowHeight = window.innerHeight -  jQuery('#topMenu').innerHeight()
  }

  ngOnDestroy(){
    this._wa.reloadTickets = false
    jQuery('.modal').modal('hide')
  }


  formatTime( t, f ){
    if( moment(t) < moment(moment().format('YYYY-MM-DD')) ){
      if( moment(t).format('YYYY-MM-DD') == moment().subtract(1,'days').format('YYYY-MM-DD') ){
        return 'ayer';
      }else{
        return moment(t).format('DD-MMM')
      }
    }

    return moment(t).format(f)
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
    this._wa.title = t['reqName']
    this._wa.chatInfo['agentName'] = t['agentName']
    this._route.navigate([`/chat/${t['ticketId']}`]);
  }

}
