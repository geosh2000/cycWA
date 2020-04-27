import { Component, OnInit } from '@angular/core';
import { InitService, ApiService, WhatsappService } from '../../../services/service.index';

import * as moment from 'moment-timezone';
import { ToastrService } from 'ngx-toastr';
declare var jQuery: any;

@Component({
  selector: 'app-write-msg',
  templateUrl: './write-msg.component.html',
  styleUrls: ['./write-msg.component.css']
})
export class WriteMsgComponent implements OnInit {

  msgSend:any = ''
  loading:Object = {}
  showEmoji = false
  templates = {}

  constructor( public _wa:WhatsappService, private _init:InitService, private _api:ApiService, private toastr:ToastrService ) { }

  ngOnInit() {
  }

  auto_grow(el) {
    let txt = el
    this.msgSend = txt
    let arr = txt.split('\n')
    let r = 0;
    for(let l of arr){
      r++
      let c = 0
      if( l != '' ){
        let line = l.split(' ')
        for( let col of line ){
          c++
          if( col.length + c > 60 ){
            r++
            c = col.length
          }else{
            c += col.length
          }
        }
      }

    }

    if( r > 5 ){
      r = 5
      jQuery('#note').css('overflow','auto')
    }else{
      jQuery('#note').css('overflow','hidden')
    }
    jQuery('#note').attr('rows',r)

    jQuery('#chatWindowCyc').innerHeight(window.innerHeight -  jQuery('#topMenu').innerHeight() - jQuery('#bottomBar').innerHeight())

  }

  submit( t = this._wa.chatInfo['ticketId'] ){

    if( !this._wa.chatInfo['ticketId'] ){
      console.error('El ticket no se cargó correctamente. El mensaje no se ha enviado', 'Envío Erróneo');
    }

    this.loading['reading'] = true;

    let params = {
      ticket: t,
      msg: jQuery('#note').val(),
      author: this._init.currentUser['hcInfo']['zdId']
    }
    this._api.restfulPut( params, 'Whatsapp/sendMsg' )
                .subscribe( res => {

                  this.loading['reading'] = false;

                  this._wa.reloadChat = true
                  this._wa.getConv( t )
                  this.msgSend = ''
                  jQuery('#note').val('')
                  jQuery('#note').attr('rows',1)
                  jQuery('#chatWindowCyc').innerHeight(window.innerHeight -  jQuery('#topMenu').innerHeight() - jQuery('#bottomBar').innerHeight())
                  this._wa.scrollBottom()

                }, err => {

                  this.loading['reading'] = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  addEmoji(e){
    this.msgSend = jQuery('#note').val() + e.emoji.colons
    jQuery('#note').val(this.msgSend)
    this.showEmoji = false
    console.log(e)
  }

  printTemplate( t ){
    jQuery('#note').val( this.msgSend += t )
    this.auto_grow( jQuery('#note').val() )
    jQuery('#note').focus()
  }

  getTemplates(){
    this.loading['templates'] = true;

    this._api.restfulPut( '', 'Lists/waTemplates' )
                .subscribe( res => {

                  this.loading['templates'] = false;

                  let t = res['data']
                  let tmpl = {}

                  for( let c of t ){
                    if( tmpl[c['categoria']] ){
                      tmpl[c['categoria']].push({titulo: c['titulo'], texto: c['texto']})
                    }else{
                      tmpl[c['categoria']] = [{titulo: c['titulo'], texto: c['texto']}]
                    }
                  }

                  this.templates = tmpl

                }, err => {

                  this.loading['templates'] = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

}
