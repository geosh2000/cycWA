import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Router } from '@angular/router';
import { Usuario } from '../classes/Usuarios';
import { WhatsappService } from './whatsapp.service';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  public socketStatus = false;
  public usuario: Usuario;
  public router: Router;

  actualTicket: any

  constructor(
    private socket: Socket, private _wa: WhatsappService
  ) {
    this.cargarStorage();
    this.checkStatus();
  }

  checkStatus() {

    this.socket.on('connect', () => {
      this.cargarStorage();
      console.log('Conectado al servidor');
      this.socketStatus = true;
      this._wa.getTickets();
      this._wa.wsStatus.next( true )
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado al servidor');
      this.socketStatus = false;
      this._wa.wsStatus.next( false )
    });

  }

  emit( evento: string, payload?: any, callback?: Function ) {

    console.log('Emitiendo', evento);
    // emit('EVENTO', payload, callback?)
    this.socket.emit( evento, payload, callback );

  }


  listen( evento: string ) {

    return this.socket.fromEvent( evento );

  }

  loginWS( nombre: string ) {

    return new Promise( (resolve, reject ) => {

      this.emit( 'configurar-usuario', { nombre }, res => {

        this.usuario = new Usuario( nombre );
        this.guardarStorage();

        resolve();

      });

    });


  }

  setTicket( ticket: string ) {

    return new Promise( (resolve, reject ) => {

      this.emit( 'activar-ticket', { ticket }, res => {

        this.usuario = new Usuario( ticket );
        // this.guardarStorage();

        resolve();

      });

    });


  }

  setUrl( url: string = window.location.href ) {

    return new Promise( (resolve, reject ) => {

      this.emit( 'desde-url', { url }, res => {

        // this.usuario = new Usuario( url );
        // this.guardarStorage();

        resolve();

      });

    });


  }

  guardarStorage() {

    localStorage.setItem( 'usuario', JSON.stringify( this.usuario ) );

  }

  cargarStorage() {

    if ( localStorage.getItem( 'currentUser' ) ) {
      this.usuario = JSON.parse( localStorage.getItem( 'currentUser' ) );
      this.loginWS( this.usuario['username'] )
      if( this.actualTicket ){
        this.setTicket( this.actualTicket )
      }
      this.setUrl()
    }

  }

  getUsuario(){

    return this.usuario;

  }

  logoutWS() {
    this.usuario = null;
    localStorage.removeItem( 'usuario' );

    const payload = { nombre: 'Unknown' };
    return new Promise( (resolve, reject ) => {

      this.emit( 'configurar-usuario', payload , res => {

        localStorage.removeItem( 'usuario' );

        resolve();

      });

    });

  }

}
