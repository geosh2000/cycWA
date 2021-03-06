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
import { Subscription, Subject, Observable } from 'rxjs';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {

  ticketObs: Subscription
  public wsStatus = new Subject<boolean>()
  

  sound = new Howl({
    src: ['/wp/assets/WhatsApp.mp3'],
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
  chatLoading = false

  // Chat Window
  chatMsgs = {}
  reloadChat = true
  chatInfo = {}
  newMsgs = 0
  bottomFlag = true
  scr = 0
  assignee:any
  actualTkt:any
  lastIsIn:any

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
  dpl = {}
  isDpl = false

  zdIds = {}

  constructor( private _init:InitService, private _api:ApiService, private orderPipe: OrderPipe, private toastr:ToastrService ) {
    this.zdesk = Globals.ZDESK
    this.getIds()
  }

  wsStatusChange(): Observable<boolean>{
    return this.wsStatus.asObservable()
  }

  // CAMBIAR s = this._init.currentUser['hcInfo']['zdId'] para "mis conversaciones" por default
  getIds(){
    this._api.restfulGet( '', 'Whatsapp/getZdIds' )
                .subscribe( res => {

                  let ids = res['data']

                  for( let d of ids ){
                    this.zdIds[d['zdId']] = d['NCorto']
                  }


                }, err => {

                  this.getIds()

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  getTickets( s = '1', to = this.reloadTickets ){
    // console.log('run tickets start')
    this.selectedFilter = s

    if( this.timeout['tickets'] ){
      // console.log('clear timeout')
      clearTimeout(this.timeout['tickets'])
    }

    switch( s ){
      case '0':
      // case 0:
        this.title = 'Sin Asignar'
        break
      case '1':
      // case 1:
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
                    // this.timeout['tickets'] = setTimeout( () => {
                    //   this.getTickets( s )
                    // },20000)
                  }

                  // console.log(this._init.currentUser)

                }, err => {
                  this.loading = false;

                  this.tickets = []

                  if( to ){
                    this.timeout['tickets'] = setTimeout( () => {
                      this.wsStatus.next( false )
                      this.getTickets( s )
                      this.wsStatus.next( true )
                    },300000)
                  }

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  updateConvs( ticket, l? ) {

    return new Promise( (resolve, reject ) => {

      this._api.restfulGet( ticket, 'Whatsapp/indivConv' )
            .subscribe( res => {
              l = false
              console.log( res )
              resolve( res['data'] )

            }, err => {
              l = false
              const error = err.error;
              this.toastr.error( error.msg, err.status );
              console.error(err.statusText, error.msg);
              reject()

            });

    });

  }

  indivList( ticket, data ){

    data['agentName'] = this.zdIds[data['assignee']]

    if( data['assignee'] == this._init.currentUser['hcInfo']['zdId'] ){
      this.sound.play()
    }

    let flag = false
    let x = 0

    let tktsO = this.tickets

    for( let t of tktsO ){
      if( t.ticketId == ticket ){

        tktsO[x]['loading'] = true

        // console.log('Registro Nuevo', data)
        // console.log('Registro Viejo', t)
        // console.log('Ids', this.zdIds)
        tktsO[x] = data

        // console.log(this.tickets)

        flag = true
        break;
      }
      x++
    }

    if( !flag ){
      this.tickets.push(data)
    }

    tktsO = this.orderPipe.transform(tktsO, 'lastMsg', true)
    // let tkts = this.orderPipe.transform(tktsO, 'lastIsIn',true)

    this.tickets = tktsO

    return true

    // console.log('Nuevo Registro')
    // this.updateConvs( ticket ).then( dataNew => {
    //   this.tickets.push( dataNew )
    //   let tktsONew = this.orderPipe.transform(this.tickets, 'lastMsg')
    //   let tktsNew = this.orderPipe.transform(tktsONew, 'lastIsIn',true)

    //   this.tickets = tktsNew
    // })


  }

  indivListTicket( ticket ){

    this._api.restfulGet( ticket, 'Whatsapp/indivConv' )
        .subscribe( res => {

          this.indivList( ticket, res['data'])

        }, err => {
          const error = err.error;
          this.toastr.error( error.msg, err.status );
          console.error(err.statusText, error.msg);

        });

  }

  getConv( loc, ft = false, to = this.reloadChat, rl = true  ){

    this.actualTkt = loc

    if( !this.bottomFlag ){
      this.newMsgs = 0
    }

    clearTimeout(this.timeout['chat'])

    if( ft ){
      this.chatMsgs = {}
      this.chatLoading = true
    }

    // dummy element
    let dummyEl = document.getElementById('note');

    // check for focus
    let isFocused = (document.activeElement === dummyEl);

    this.loading = true;
    let refresFlag = false

    this._api.restfulGet( loc, 'Whatsapp/getChat' )
                .subscribe( res => {

                  if( loc != this.actualTkt ){
                    return false
                  }

                  this.loading = false;
                  // this.title = res['data'][0]['reqName']
                  this.chatInfo['requester'] = res['data'][0]['reqName']
                  this.chatInfo['phone'] = res['data'][0]['reqPhone']
                  this.chatInfo['rqId'] = res['data'][0]['zdId']
                  this.chatInfo['agentName'] = res['data'][0]['asignado']
                  this.chatInfo['ticketId'] = loc

                  if( ft ){
                    // this.getUserInfo()
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
                    // this.timeout['chat'] = setTimeout( () => {
                    //   this.getConv( loc )
                    // },20000)
                  }

                  this.chatLoading = false

                }, err => {
                  if( rl ){
                    // this.timeout['chat'] = setTimeout( () => {
                    //   this.getConv( loc )
                    // },20000)
                  }

                  this.loading = false;
                  this.chatLoading = false

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

    if( !zdClientId ){
      return false
    }

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

                  let rsp = res['rsp']

                  if( rsp['response'] != 200 ){

                    let err = rsp['data']
                    let msg = ''
                    let errType = ''

                    for( let fld in err['details'] ){
                      if( err['details'].hasOwnProperty(fld) ){
                        for( let e of err['details'][fld] ){
                          msg += ` ${e['description']} (${e['error']})`
                          errType = e['error']
                        }
                      }
                    }

                    if( errType == 'DuplicateValue' ){
                      this.isDpl = true
                      this.dpl = err['user']
                    }

                    this.indivListTicket( this.actualTkt )

                    this.toastr.error( msg, err['description'] );
                  }else{
                    this.toastr.success( 'Información guardada correctamente', 'Guardado' );

                    // this.indivList( this.actualTkt, msg['data'] )
                    this.getUserInfo()
                    this._api.restfulGet( this.actualTkt, 'Whatsapp/indivConv' )
                        .subscribe( rd => {
                          this.indivList( this.actualTkt, rd['data'] )

                        }, err => {
                          const error = err.error;
                          this.toastr.error( error.msg, err.status );
                          console.error(err.statusText, error.msg);


                        });
                  }


                }, err => {
                  this.loadingUI = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  markAsRead( d ){
    this.loading = true;

    this._api.restfulPut( {date: d, ticket: this.actualTkt}, 'Whatsapp/markAsRead' )
                .subscribe( res => {

                  this.loading = false;
                  this.getTickets(this.selectedFilter)
                  this.lastIsIn = res['data']

                }, err => {
                  this.loading = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  markAsUnread(){
    this.loading = true;

    this._api.restfulPut( {ticket: this.actualTkt}, 'Whatsapp/markAsUnread' )
                .subscribe( res => {

                  this.loading = false;
                  this.getTickets(this.selectedFilter)
                  this.lastIsIn = 1

                }, err => {
                  this.loading = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  mergeUsers( c, d ){
    this.loading = true
    this._api.restfulPut( {actual: c, dest: d, userFields: this.userInfo['user_fields'], ticket: this.actualTkt }, 'Whatsapp/mergeUsers' )
                .subscribe( res => {

                  this.loading = false;

                  if( res['data']['response'] == 200 ){
                    this.getUserInfo(d)
                    this.toastr.success('Usuarios fusionados correctamente', 'Fusión Realizada')
                    this.isDpl = false
                    this.dpl = []
                  }else{
                    this.toastr.error(res['data']['data']['error'], 'Error')
                  }


                }, err => {
                  this.loading = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

}


