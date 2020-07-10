import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { TokenCheckService, InitService, WhatsappService } from '../../services/service.index';
import { WebsocketService } from '../../services/websocket.service';


declare var jQuery:any;

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  @Input() tipo:any = ''
  @Input() userInfo = {}
  @Input() idiomas = []
  @Output() _link = new EventEmitter<any>()

  constructor( public _init:InitService, public _token:TokenCheckService, public _wa:WhatsappService, public _route:Router, public ws: WebsocketService,
               private location: Location) { }

  ngOnInit() {
    window.setTimeout( () => {
      if( !this._token.token ){
        this.login()
      }
    },1000)
  }

  login(){
    jQuery('#loginModal').modal('show')
  }

  logout(){
    jQuery('#logOutModal').modal('show')
  }

  isChat( t ){
    let exp = /chat/gm
    return t.match(exp)
  }

  goBack() {
    this.location.back();
  }

  setFilter( t ){

    if( this._wa.zdesk ){
      this._wa.reloadTickets = true
      this._wa.getTickets( t == '' ? this._init.currentUser['hcInfo']['zdId'] : t )
    }else{
      this._route.navigate(['/app', t])
    }

  }

  openModal( e ){
    this._link.emit(e)
  }

  refreshMsg( t ){
    this._wa.refreshWaMsg( t )
  }

  selectedLang(e){
    this._wa.userInfo['user_fields']['idioma_cliente'] = e.value
    this._wa.saveUserInfo('user_fields')
  }

}
