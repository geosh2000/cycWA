import { Component, OnInit } from '@angular/core';
import { InitService, ApiService, WhatsappService } from '../../../services/service.index';

import * as moment from 'moment-timezone';
import { ToastrService } from 'ngx-toastr';
import { OrderPipe } from 'ngx-order-pipe';
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
  idiomas =[]

  constructor( public _wa:WhatsappService, private _init:InitService, private _api:ApiService, private toastr:ToastrService, private order:OrderPipe ) { }

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

                  this._wa.getTickets( this._wa.selectedFilter )

                  // for( let c of this._wa.tickets ){
                  //   if( c['ticketId'] == t ){
                  //     c['lastIsIn'] = 0;
                  //     c['lastConv'] = params.msg
                  //     c['lastMsg'] = moment().format('YYYY-MM-DD HH:mm:ss')

                  //     let tktsO = this.order.transform(this._wa.tickets, 'lastMsg')
                  //     let tkts = this.order.transform(tktsO, 'lastIsIn',true)
                  //     this._wa.tickets = tkts
                  //     return true
                  //   }
                  // }

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

  printTemplate( i ){

    let dynamic:any
    let t = i['texto']

    if( i['dynamicFields'] ){
      dynamic = JSON.parse(i['dynamicFields'])

      for(let p in dynamic){
        if( dynamic.hasOwnProperty(p) ){
          console.log(dynamic[p], p)
          t = t.replace('@'+p, this._init.currentUser.hcInfo[dynamic[p]])
        }
      }
    }

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

                    if(  tmpl[c['idioma']] ){
                      if( tmpl[c['idioma']][c['categoria']] ){
                        tmpl[c['idioma']][c['categoria']].push({titulo: c['titulo'], texto: c['texto'], dynamicFields: c['dynamicFields']})
                      }else{
                        tmpl[c['idioma']][c['categoria']] = [{titulo: c['titulo'], texto: c['texto'], dynamicFields: c['dynamicFields']}]
                      }
                    }else{
                      this.idiomas.push(c['idioma'])
                      tmpl[c['idioma']] = { [c['categoria']]: [{titulo: c['titulo'], texto: c['texto'], dynamicFields: c['dynamicFields']}] }
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

  autoGrowTextZone(e) {
    e.target.style.height = "0px";
    e.target.style.height = (e.target.scrollHeight + 25)+"px";
    this.msgSend = e.target.value
  }

}
