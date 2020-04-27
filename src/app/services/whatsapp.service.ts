import { Injectable, ViewChild } from '@angular/core';
import { InitService } from './init.service';
import { ApiService } from './api.service';
import { OrderPipe } from 'ngx-order-pipe';
import { ToastrService } from 'ngx-toastr';

declare var jQuery: any;
import * as Globals from '../globals';
import * as moment from 'moment-timezone';
import { FormGroup } from '@angular/forms';

import { Howl } from 'howler';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {

  sound = new Howl({
    src: ['/wazd/assets/WhatsApp.mp3'],
    volume: 1,
    preload: true
  });

  // Navigation
  lastUrl = '/app'
  timeout:Object = {}
  // listConversations
  title = 'Mis Conversaciones'
  loading = false
  tickets = []
  reloadTickets = true
  selectedFilter:any

  // Chat Window
  chatMsgs = {}
  reloadChat = true
  chatInfo = {}
  newMsgs = 0
  bottomFlag = true
  scr = 0
  assignee:any

  // Attachments
  imageForm: FormGroup
  imageFileUp: File

  // Layout
  zdesk = false

  // INFO
  userInfo = {}
  originalUserInfo = {}
  rsvHistory = []
  loadingInfo = false
  loadingUI = false

  constructor( private _init:InitService, private _api:ApiService, private orderPipe: OrderPipe, private toastr:ToastrService ) {
    this.zdesk = Globals.ZDESK
  }

  getTickets( s = this._init.currentUser['hcInfo']['zdId'], to = this.reloadTickets ){
    // console.log('run tickets start')
    this.selectedFilter = s

    if( this.timeout['tickets'] ){
      // console.log('clear timeout')
      clearTimeout(this.timeout['tickets'])
    }

    switch( s ){
      case '0':
      case 0:
        this.title = 'Sin Asignar'
        break
      case '1':
      case 1:
        this.title = 'Todas las conversaciones'
        break
      default:
        this.title = 'Mis Conversaciones'
        break
    }

    if( !this.reloadTickets && !this.zdesk ){
      // console.log('run tickets exit before start')
      return true
    }

    this.loading = true;

    this._api.restfulGet( s, 'Whatsapp/listConv' )
                .subscribe( res => {
                  // console.log('run tickets loaded')
                  this.loading = false;
                  let tktsO = this.orderPipe.transform(res['data'], 'lastMsg')
                  let tkts = this.orderPipe.transform(tktsO, 'lastIsIn',true)
                  // let tkts = res['data']
                  let notif = false
                  let ticketsNot = []

                  for( let t of tkts){
                    if( t['assignee'] == s && t['lastIsIn'] == '1' && t['soundNotif'] == '0' && t['isRead'] == '0'  ){
                      notif = true
                      ticketsNot.push(t['ticketId'])
                    }

                    // if( t['ticketId'] == this.ticketSelected && t['lastIsIn'] == '1' && t['isRead'] == '0' ){
                    //   this.reloadTkt.emit(this.ticketSelected)
                    // }
                  }

                  if( notif ){
                    this.okNotif(ticketsNot)
                  }

                  this.tickets = tkts

                  if( to || this.zdesk ){
                    // console.log('run tickets program next run')
                    this.timeout['tickets'] = setTimeout( () => {
                      this.getTickets( s )
                    },10000)
                  }

                  // console.log('run tickets end width reload flag: ', this.reloadTickets)

                }, err => {
                  this.loading = false;

                  this.tickets = []

                  if( to ){
                    this.timeout['tickets'] = setTimeout( () => {
                      this.getTickets( s )
                    },10000)
                  }

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  getConv( loc, ft = false, to = this.reloadChat, rl = true  ){

    if( !this.bottomFlag ){
      this.newMsgs = 0
    }

    clearTimeout(this.timeout['chat'])

    if( ft ){
      this.chatMsgs = {}
    }

    // dummy element
    let dummyEl = document.getElementById('note');

    // check for focus
    let isFocused = (document.activeElement === dummyEl);

    this.loading = true;
    let refresFlag = false

    this._api.restfulGet( loc, 'Whatsapp/getChat' )
                .subscribe( res => {

                  this.loading = false;
                  // this.title = res['data'][0]['reqName']
                  this.chatInfo['requester'] = res['data'][0]['reqName']
                  this.chatInfo['phone'] = res['data'][0]['reqPhone']
                  this.chatInfo['rqId'] = res['data'][0]['zdId']
                  this.chatInfo['agentName'] = res['data'][0]['asignado']
                  this.chatInfo['ticketId'] = loc

                  if( ft ){
                    this.getUserInfo()
                    this.rsvHistory = []
                    this.userInfo = {}
                    this.originalUserInfo = {}
                  }

                  if( this._init.currentUser['hcInfo']['zdId'] == this.assignee && isFocused){
                    this.clearNotif(loc)
                  }
                  // let url = 'https://material.angular.io/assets/img/examples/shiba1.jpg'
                  // jQuery('.client-image').css('background-image', 'url(' + url + ')');

                  let items = res['data']
                  let result:Object = {}
                  items = this.orderPipe.transform(items, 'date')

                  for( let i of items ){
                    i['dt'] = moment(i['date']).tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss')
                    let dt = moment(i['date']).tz('America/Bogota').format('YYYY-MM-DD') == moment().format('YYYY-MM-DD') ? 'HOY' : moment(i['date']).tz('America/Bogota').format('YYYY-MM-DD')
                    if( result[dt] ){
                      result[dt].push(i)
                    }else{
                      result[dt] = [i]
                    }

                    i['attachments'] = JSON.parse(i['attachments'])
                  }

                  let msgs = 0

                  for( let dt in result ){
                    if( result.hasOwnProperty(dt) ){
                      if( this.chatMsgs[dt] ){
                        if( result[dt].length > this.chatMsgs[dt].length ){
                          for(let z = this.chatMsgs[dt].length; z < result[dt].length; z++ ){
                            this.chatMsgs[dt].push(result[dt][z])
                            msgs++
                          }
                        }
                      }else{
                        this.chatMsgs[dt] = result[dt]
                        msgs += result[dt].length
                      }
                    }
                  }

                  if( this.bottomFlag ){
                    this.newMsgs = msgs
                  }


                  if(isFocused){
                    jQuery('#note').focus()
                  }

                  if( ft || !this.bottomFlag ){
                     setTimeout( () => {
                      this.scrollBottom()
                      if(isFocused){
                        jQuery('#note').focus()
                      }
                    },500)
                  }

                  // if( to ){
                  //   setTimeout( () => {
                  //     this.scrollBtm()
                  //     if(isFocused){
                  //       jQuery('#note').focus()
                  //     }
                  //   },500)
                  // }

                  if( to ){
                    this.timeout['chat'] = setTimeout( () => {
                      this.getConv( loc )
                    },10000)
                  }

                }, err => {
                  if( rl ){
                    this.timeout['chat'] = setTimeout( () => {
                      this.getConv( loc )
                    },10000)
                  }

                  this.loading = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  attach( image_file ){
    this.loading['attach'] = true
    let Image = image_file.nativeElement

    if( Image.files && Image.files[0] ){
      this.imageFileUp = Image.files[0]
    }

    let ImageFile: File = this.imageFileUp

    let formData: FormData = new FormData()
    formData.append( 'fname', this.imageForm.controls['fname'].value)
    formData.append( 'dir',   this.imageForm.controls['dir'].value)
    formData.append( 'ftype', this.imageForm.controls['ftype'].value)
    formData.append( 'image', ImageFile, ImageFile.name)

    this._api.restfulImgPost( formData, 'UploadImage/uploadImage' )
              .subscribe( res => {

                  jQuery('#attachModal').modal('hide')
                  this.loading['attach'] = false
                  // console.log(res)
              }, err => {
                  this.loading['attach'] = false
                  console.log('ERROR', err)
                })

  }

  scrollBottom(){

    let clh = document.getElementById('chatWindowCyc').clientHeight
    let dht = document.getElementById('chatWindowCyc').scrollHeight

    document.getElementById('chatWindowCyc').scrollTop = dht - clh
    this.scr = dht - document.getElementById('chatWindowCyc').scrollTop - clh
    this.newMsgs = 0
    this.bottomFlag = false

    // console.log( 'scrolledBottom', 'flag', this.bottomFlag )

  }

  clearNotif(t){

    this._api.restfulPut( [t], 'Whatsapp/clearNotif' )
                .subscribe( res => {

                  // console.log('New Notification Done!')

                }, err => {
                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  okNotif( t ){

    this._api.restfulPut( t, 'Whatsapp/soundNotif' )
                .subscribe( res => {

                  console.log('New Sound Done!')
                  this.sound.play()

                }, err => {
                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  refreshWaMsg( t ){
    this.loading = true;
    clearTimeout(this.timeout['chat'])

    this._api.restfulPut( {tipo: 'whatsapp', ticket: t}, 'Calls/zdPush' )
                .subscribe( res => {

                  this.loading = false;
                  this.getConv(t, true)

                }, err => {
                  this.loading = false;
                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  getUserInfo( zdId = this.chatInfo['rqId'] ){
    this.loadingInfo = true;
    this.userInfo = {}
    this.originalUserInfo = {}

    this._api.restfulGet( zdId, 'Calls/showUser' )
                .subscribe( res => {

                  // console.log(res['data']['data'])

                  this.loadingInfo = false;
                  this.userInfo['name'] = res['data']['data']['user']['name']
                  this.userInfo['email'] = res['data']['data']['user']['email']
                  this.userInfo['phone'] = res['data']['data']['user']['phone']
                  this.userInfo['rqId'] = zdId
                  this.userInfo['user_fields'] = res['data']['data']['user']['user_fields']

                  if( res['data']['data']['user']['user_fields'] && res['data']['data']['user']['user_fields'] ){
                    this.userInfo['whatsapp'] = res['data']['data']['user']['user_fields']['whatsapp'] ? res['data']['data']['user']['user_fields']['whatsapp'] : ''
                  }else{
                    this.userInfo['whatsapp'] = ''
                  }

                  this.originalUserInfo = JSON.parse(JSON.stringify(this.userInfo))
                  this.getRsvHistory()
                  // console.log(res)


                }, err => {
                  this.loadingInfo = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  getRsvHistory( zdClientId = this.chatInfo['rqId'] ){

    this.loadingInfo = true
    this.rsvHistory = []

    this._api.restfulGet( zdClientId, 'Rsv/getRsvHistory' )
                .subscribe( res => {

                  this.loadingInfo = false;
                  this.rsvHistory = res['data']

                }, err => {
                  this.loadingInfo = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  saveUserInfo(f){
    this.loadingUI = true;

    this._api.restfulPut( {values: this.userInfo, field: f}, 'Calls/updateUserV2' )
                .subscribe( res => {

                  this.loadingUI = false;
                  this.getUserInfo()

                }, err => {
                  this.loadingUI = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

}


