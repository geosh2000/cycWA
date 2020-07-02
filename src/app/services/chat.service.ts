import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(
    public wsService: WebsocketService
  ) { }

  sendMessage( mensaje: string){

    // console.log('service msg called')

    const payload = {
      de: this.wsService.usuario.nombre,
      cuerpo: mensaje
    };

    this.wsService.emit( 'mensaje', payload );
  }

  getMessages() {
    return this.wsService.listen('mensaje-nuevo');
  }

  getMessagesPrivate() {
    return this.wsService.listen( 'mensaje-privado' );
  }

  getUsuariosActivos() {
    return this.wsService.listen( 'usuarios-activos' );
  }

  getNewWhatsapps() {
    return this.wsService.listen( 'nuevo-whatsapp' );
  }

  notifyNewMsgTicket( t ) {
    return this.wsService.listen( t );
  }


}
