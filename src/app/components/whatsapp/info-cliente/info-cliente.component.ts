import { Component, OnInit } from '@angular/core';
import { InitService, ApiService, WhatsappService } from '../../../services/service.index';

import * as moment from 'moment-timezone';
import { ToastrService } from 'ngx-toastr';
declare var jQuery: any;

@Component({
  selector: 'app-info-cliente',
  templateUrl: './info-cliente.component.html',
  styleUrls: ['./info-cliente.component.css']
})
export class InfoClienteComponent implements OnInit {

  loading:Object = {}

  idiomas:Object = [
    {idioma: 'español', lang: 'idioma_es'},
    {idioma: 'inglés', lang: 'idioma_en'},
    {idioma: 'francés', lang: 'idioma_fr'},
    {idioma: 'portugués', lang: 'idioma_pt'}
  ]

constructor( public _wa:WhatsappService, private _init:InitService, private _api:ApiService, private toastr:ToastrService ) { }

ngOnInit() {
  }

openInfo(){
    jQuery('#userInfo').modal('show')
    this._wa.getUserInfo()
  }

tabSelected( e ){
    console.log(e.tab.textLabel)
    if( e.tab.textLabel == 'Reservas' ){
      this._wa.getRsvHistory()
    }
  }

selectedLang(e){
    this._wa.userInfo['user_fields']['idioma_cliente'] = e.value
    console.log(this._wa.userInfo)
  }

}
